import openai
import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json

logger = logging.getLogger(__name__)

# Pydantic models
class ItineraryActivity(BaseModel):
    title: str
    description: str
    location: str
    duration_minutes: int
    estimated_cost: str
    category: Optional[str] = None

class ItineraryResponse(BaseModel):
    activities: List[ItineraryActivity]
    narrative_summary: str
    total_estimated_cost: str

class JournalRecapResponse(BaseModel):
    title: str
    content: str
    highlights: List[str]
    mood_score: int  # 1-10
    shareable_text: str

class OpenAIIntegration:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        openai.api_key = self.api_key
        self.client = openai.OpenAI(api_key=self.api_key)

    async def generate_itinerary(
        self,
        location: str,
        mood: str,
        budget: str,
        duration_hours: int = 4,
        real_venues: str = None
    ) -> ItineraryResponse:
        """Generate a personalized itinerary based on user preferences"""
        try:
            # Budget mapping
            budget_descriptions = {
                'low': 'budget-conscious, looking for free and low-cost activities (under $50)',
                'medium': 'treating myself reasonably ($50-150)',
                'high': 'premium experiences, willing to splurge ($150+)'
            }
            
            # Mood mapping
            mood_descriptions = {
                'adventurous': 'seeking exciting, thrilling experiences and outdoor activities',
                'relaxed': 'wanting calm, peaceful activities and leisurely experiences',
                'cultural': 'interested in museums, art, history, and cultural experiences',
                'foodie': 'focused on culinary experiences, restaurants, and local cuisine',
                'romantic': 'looking for intimate, romantic activities perfect for couples',
                'family': 'seeking family-friendly activities suitable for all ages',
                'nightlife': 'interested in evening entertainment, bars, and vibrant nightlife',
                'nature': 'preferring outdoor activities, parks, and natural settings',
                'shopping': 'focused on shopping districts, markets, and retail experiences',
                'wellness': 'interested in spa, yoga, meditation - peaceful and mindful'
            }
            
            budget_desc = budget_descriptions.get(budget, budget_descriptions['medium'])
            mood_desc = mood_descriptions.get(mood, mood_descriptions['adventurous'])
            
            # Enhanced prompt with real venue data
            system_prompt = f"""You are a world-class travel planner creating personalized itineraries. 
            Create an engaging {duration_hours}-hour itinerary for {location}.
            
            User preferences:
            - Mood: {mood_desc}
            - Budget: {budget_desc}
            - Duration: {duration_hours} hours
            
            {f"Real venues available: {real_venues}" if real_venues else ""}
            
            Format your response as a JSON object with this structure:
            {{
                "activities": [
                    {{
                        "title": "Activity Name",
                        "description": "Detailed description (50-100 words)",
                        "location": "Specific address or neighborhood",
                        "duration_minutes": 120,
                        "estimated_cost": "$", "$$", or "$$$",
                        "category": "category_name"
                    }}
                ],
                "narrative_summary": "Engaging overview of the day (100-150 words)",
                "total_estimated_cost": "Overall budget estimate"
            }}
            
            Guidelines:
            - Include 3-6 activities
            - Use real places when possible
            - Vary activity types and locations
            - Consider travel time between activities
            - Make descriptions engaging and specific
            - Include practical details"""

            user_prompt = f"Create a perfect {duration_hours}-hour itinerary for {location} for someone who is {mood_desc} with a {budget_desc} budget."

            response = await self._make_openai_request(system_prompt, user_prompt)
            return self._parse_itinerary_response(response)
            
        except Exception as e:
            logger.error(f"Itinerary generation error: {e}")
            # Return fallback itinerary
            return self._get_fallback_itinerary(location, mood, budget, duration_hours)

    async def generate_journal_recap(
        self,
        activities: List[str],
        location: str = None,
        date: str = None
    ) -> JournalRecapResponse:
        """Generate a journal recap from completed activities"""
        try:
            activities_text = "\n".join([f"- {activity}" for activity in activities])
            
            system_prompt = """You are a creative travel journal writer. Create an engaging, personal journal recap of the user's day.
            
            Format your response as a JSON object with this structure:
            {
                "title": "Catchy title for the day",
                "content": "Personal, reflective journal entry (200-300 words)",
                "highlights": ["Top 3-5 memorable moments"],
                "mood_score": 8,
                "shareable_text": "Social media friendly summary (Twitter-length)"
            }
            
            Make it personal, engaging, and capture the emotions and experiences of the day."""

            user_prompt = f"""Create a journal recap for this day:
            Location: {location or 'Unknown'}
            Date: {date or 'Today'}
            Activities:
            {activities_text}"""

            response = await self._make_openai_request(system_prompt, user_prompt)
            return self._parse_journal_response(response)
            
        except Exception as e:
            logger.error(f"Journal recap generation error: {e}")
            return self._get_fallback_journal(activities, location)

    async def _make_openai_request(self, system_prompt: str, user_prompt: str) -> str:
        """Make request to OpenAI API"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise

    def _parse_itinerary_response(self, response: str) -> ItineraryResponse:
        """Parse OpenAI response into ItineraryResponse model"""
        try:
            # Try to parse JSON response
            if response.strip().startswith('{'):
                data = json.loads(response)
                
                # Parse activities
                activities = []
                for activity_data in data.get('activities', []):
                    activity = ItineraryActivity(
                        title=activity_data.get('title', 'Local Experience'),
                        description=activity_data.get('description', 'Discover something amazing.'),
                        location=activity_data.get('location', 'Local area'),
                        duration_minutes=activity_data.get('duration_minutes', 120),
                        estimated_cost=activity_data.get('estimated_cost', '$$'),
                        category=activity_data.get('category', 'exploration')
                    )
                    activities.append(activity)
                
                return ItineraryResponse(
                    activities=activities,
                    narrative_summary=data.get('narrative_summary', 'A wonderful day of activities.'),
                    total_estimated_cost=data.get('total_estimated_cost', 'Cost varies')
                )
            else:
                # Fallback parsing for non-JSON responses
                return ItineraryResponse(
                    activities=[
                        ItineraryActivity(
                            title="Local Exploration",
                            description=response[:200] + "..." if len(response) > 200 else response,
                            estimated_cost="$$",
                            duration_minutes=120,
                            location="Local area",
                            category="exploration"
                        )
                    ],
                    narrative_summary="Explore local attractions and experiences.",
                    total_estimated_cost="$$"
                )
                
        except Exception as e:
            logger.error(f"Error parsing itinerary response: {e}")
            return ItineraryResponse(
                activities=[
                    ItineraryActivity(
                        title="Local Adventure",
                        description="Discover amazing local experiences.",
                        estimated_cost="$$",
                        duration_minutes=180,
                        location="Local area",
                        category="adventure"
                    )
                ],
                narrative_summary="A great day of local exploration.",
                total_estimated_cost="$$"
            )

    def _parse_journal_response(self, response: str) -> JournalRecapResponse:
        """Parse OpenAI response into JournalRecapResponse model"""
        try:
            if response.strip().startswith('{'):
                data = json.loads(response)
                return JournalRecapResponse(
                    title=data.get('title', 'My Travel Day'),
                    content=data.get('content', response),
                    highlights=data.get('highlights', ['Great experiences']),
                    mood_score=data.get('mood_score', 8),
                    shareable_text=data.get('shareable_text', 'Amazing day exploring!')
                )
            else:
                return JournalRecapResponse(
                    title="My Travel Day",
                    content=response,
                    highlights=["Great experiences"],
                    mood_score=8,
                    shareable_text="Amazing day exploring!"
                )
        except Exception as e:
            logger.error(f"Error parsing journal response: {e}")
            return JournalRecapResponse(
                title="My Travel Day",
                content="Had a wonderful day exploring new places and experiences.",
                highlights=["Great discoveries", "Memorable moments"],
                mood_score=8,
                shareable_text="Amazing day exploring!"
            )

    def _get_fallback_itinerary(self, location: str, mood: str, budget: str, duration_hours: int) -> ItineraryResponse:
        """Provide fallback itinerary when OpenAI fails"""
        return ItineraryResponse(
            activities=[
                ItineraryActivity(
                    title=f"Explore {location}",
                    description=f"Discover the best of {location} with a {mood} adventure.",
                    location=f"Central {location}",
                    duration_minutes=duration_hours * 60 // 3,
                    estimated_cost="$$",
                    category="exploration"
                ),
                ItineraryActivity(
                    title="Local Dining Experience",
                    description="Enjoy authentic local cuisine at a recommended restaurant.",
                    location=f"{location} restaurant district",
                    duration_minutes=90,
                    estimated_cost="$$",
                    category="dining"
                ),
                ItineraryActivity(
                    title="Cultural Discovery",
                    description="Visit a local attraction or cultural site.",
                    location=f"{location} cultural district",
                    duration_minutes=120,
                    estimated_cost="$",
                    category="culture"
                )
            ],
            narrative_summary=f"Spend {duration_hours} hours discovering the highlights of {location} with a perfect blend of exploration, dining, and cultural experiences.",
            total_estimated_cost="$$"
        )

    def _get_fallback_journal(self, activities: List[str], location: str) -> JournalRecapResponse:
        """Provide fallback journal when OpenAI fails"""
        return JournalRecapResponse(
            title=f"Adventures in {location or 'the City'}",
            content=f"Today was filled with amazing experiences. I explored {len(activities)} different activities and made wonderful memories. Each moment brought new discoveries and joy.",
            highlights=activities[:3] if len(activities) >= 3 else activities,
            mood_score=8,
            shareable_text=f"Amazing day in {location or 'the city'}! 🌟✈️"
        )

# Create a singleton instance
openai_integration = OpenAIIntegration()
