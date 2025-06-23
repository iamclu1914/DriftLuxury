import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ItineraryService {
  static const String _foursquareBaseUrl = 'https://api.foursquare.com/v3';
  static const String _eventbriteBaseUrl = 'https://www.eventbriteapi.com/v3';
  static const String _googleMapsBaseUrl = 'https://maps.googleapis.com/maps/api';
  static const String _openaiBaseUrl = 'https://api.openai.com/v1';

  // Mood-based venue categories for Foursquare
  static const Map<String, List<String>> _moodVenueCategories = {
    'Adventurous': [
      '16000', // Outdoor Recreation
      '10032', // Nightlife Spot (Rooftop bars)
      '13065', // Event Space
      '11000', // Food
    ],
    'Relaxed': [
      '18021', // Spa
      '13236', // Beach
      '13032', // Café
      '16000', // Parks/Nature
    ],
    'Romantic': [
      '13065', // Fine Dining
      '10032', // Wine Bar
      '18021', // Spa
      '10000', // Arts & Entertainment
    ],
    'Social': [
      '10032', // Nightlife
      '10000', // Entertainment
      '13065', // Events
      '11000', // Food (Food trucks, restaurants)
    ],
  };

  // Mood-based event categories for Eventbrite
  static const Map<String, List<String>> _moodEventCategories = {
    'Adventurous': ['108', '109', '113'], // Sports, Travel & Outdoor, Other
    'Relaxed': ['107', '102'], // Health & Wellness, Music
    'Romantic': ['110', '102'], // Food & Drink, Music
    'Social': ['103', '105', '102'], // Performing & Visual Arts, Nightlife, Music
  };

  static const Map<String, String> _moodDescriptions = {
    'Adventurous': 'Energy, curiosity, spontaneity, thrill - Outdoor getaways, hidden gems, rooftop bars, off-grid trails, pop-up events',
    'Relaxed': 'Calm, peace, restoration, comfort - Spa retreats, beaches, cozy coffee shops, nature walks, late-night lounges with soft music',
    'Romantic': 'Intimacy, charm, connection, warmth - Candlelit restaurants, scenic rooftops, couples\' spas, wine tastings',
    'Social': 'Connection, celebration, energy, community - Bars, concerts, food trucks, block parties, dance spots',
  };

  Future<Map<String, dynamic>> generateItinerary({
    required String mood,
    required double latitude,
    required double longitude,
    required String cityName,
    int radius = 5000, // 5km radius
  }) async {
    try {
      // 1. Get venues from Foursquare
      final venues = await _getFoursquareVenues(mood, latitude, longitude, radius);
      
      // 2. Get events from Eventbrite
      final events = await _getEventbriteEvents(mood, cityName);
      
      // 3. Get location images from Google Maps for top venues
      final venuesWithImages = await _addGoogleMapsImages(venues);
      
      // 4. Add images to events using similar strategy
      final eventsWithImages = await _addImagesToEvents(events);
      
      // 5. Generate personalized itinerary with OpenAI
      final itinerary = await _generateAIItinerary(mood, venuesWithImages, eventsWithImages, cityName);
      
      return {
        'success': true,
        'mood': mood,
        'city': cityName,
        'itinerary': itinerary,
        'venues': venuesWithImages,
        'events': eventsWithImages,
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  Future<List<Map<String, dynamic>>> _getFoursquareVenues(
    String mood,
    double latitude,
    double longitude,
    int radius,
  ) async {
    final apiKey = dotenv.env['FOURSQUARE_API_KEY'];
    if (apiKey == null) throw Exception('Foursquare API key not found');

    final categories = _moodVenueCategories[mood] ?? [];
    final venues = <Map<String, dynamic>>[];

    for (final category in categories) {
      try {
        final response = await http.get(
          Uri.parse('$_foursquareBaseUrl/places/search')
              .replace(queryParameters: {
            'll': '$latitude,$longitude',
            'radius': radius.toString(),
            'categories': category,
            'limit': '10',
            'sort': 'RATING',
          }),
          headers: {
            'Authorization': apiKey,
            'Accept': 'application/json',
          },
        );

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final results = data['results'] as List? ?? [];
          venues.addAll(results.cast<Map<String, dynamic>>());
        }
      } catch (e) {
        debugPrint('Error fetching venues for category $category: $e');
      }
    }

    // Remove duplicates and limit to top 15
    final uniqueVenues = <String, Map<String, dynamic>>{};
    for (final venue in venues) {
      final id = venue['fsq_id'] as String? ?? '';
      if (id.isNotEmpty && !uniqueVenues.containsKey(id)) {
        uniqueVenues[id] = venue;
      }
    }

    return uniqueVenues.values.take(15).toList();
  }

  Future<List<Map<String, dynamic>>> _getEventbriteEvents(
    String mood,
    String cityName,
  ) async {
    final apiKey = dotenv.env['EVENTBRITE_API_KEY'];
    if (apiKey == null) throw Exception('Eventbrite API key not found');

    final categories = _moodEventCategories[mood] ?? [];
    final events = <Map<String, dynamic>>[];

    for (final category in categories) {
      try {
        final response = await http.get(
          Uri.parse('$_eventbriteBaseUrl/events/search/')
              .replace(queryParameters: {
            'location.address': cityName,
            'categories': category,
            'sort_by': 'date',
            'start_date.range_start': DateTime.now().toIso8601String(),
            'start_date.range_end': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
            'expand': 'venue,organizer',
          }),
          headers: {
            'Authorization': 'Bearer $apiKey',
          },
        );

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final eventList = data['events'] as List? ?? [];
          events.addAll(eventList.cast<Map<String, dynamic>>());
        }
      } catch (e) {
        debugPrint('Error fetching events for category $category: $e');
      }
    }

    return events.take(10).toList(); // Limit to top 10 events
  }

  Future<List<Map<String, dynamic>>> _addGoogleMapsImages(
    List<Map<String, dynamic>> venues,
  ) async {
    final apiKey = dotenv.env['GOOGLE_MAPS_API_KEY'];
    if (apiKey == null) {
      // If no Google Maps API, add placeholder images to all venues
      for (final venue in venues) {
        final venueName = venue['name'] as String? ?? '';
        venue['image_url'] = _getCategoryPlaceholderImage(venueName);
      }
      return venues;
    }

    final venuesWithImages = <Map<String, dynamic>>[];

    for (final venue in venues.take(15)) { // Increased from 10 to 15
      try {
        final venueName = venue['name'] as String? ?? '';
        final location = venue['location'] as Map<String, dynamic>? ?? {};
        final address = location['formatted_address'] as String? ?? '';
        final locality = location['locality'] as String? ?? '';
        final region = location['region'] as String? ?? '';

        // Try multiple search strategies
        final searchQueries = [
          '$venueName $address',
          '$venueName $locality',
          '$venueName $region',
          venueName,
        ];

        bool imageFound = false;
        
        for (final searchQuery in searchQueries) {
          if (imageFound || searchQuery.trim().isEmpty) continue;
          
          try {
            final placeResponse = await http.get(
              Uri.parse('$_googleMapsBaseUrl/place/findplacefromtext/json')
                  .replace(queryParameters: {
                'input': searchQuery,
                'inputtype': 'textquery',
                'fields': 'place_id,photos',
                'key': apiKey,
              }),
            );

            if (placeResponse.statusCode == 200) {
              final placeData = json.decode(placeResponse.body);
              final candidates = placeData['candidates'] as List? ?? [];
              
              if (candidates.isNotEmpty) {
                final candidate = candidates.first as Map<String, dynamic>;
                final photos = candidate['photos'] as List? ?? [];
                
                if (photos.isNotEmpty) {
                  final photo = photos.first as Map<String, dynamic>;
                  final photoReference = photo['photo_reference'] as String?;
                  
                  if (photoReference != null) {
                    venue['image_url'] = '$_googleMapsBaseUrl/place/photo?maxwidth=600&photoreference=$photoReference&key=$apiKey';
                    imageFound = true;
                    break;
                  }
                }
              }
            }
          } catch (e) {
            debugPrint('Error searching for $searchQuery: $e');
            continue;
          }
          
          // Small delay to respect rate limits
          await Future.delayed(const Duration(milliseconds: 100));
        }

        // If still no image from Google Places, try Street View
        if (!imageFound) {
          final geocode = venue['geocodes'] as Map<String, dynamic>? ?? {};
          final main = geocode['main'] as Map<String, dynamic>? ?? {};
          final lat = main['latitude'] as double?;
          final lng = main['longitude'] as double?;
          
          if (lat != null && lng != null) {
            venue['image_url'] = '$_googleMapsBaseUrl/streetview?size=400x300&location=$lat,$lng&heading=235&pitch=10&key=$apiKey&fov=80';
            imageFound = true;
          }
        }
        
        // If still no image, use a category-based placeholder
        if (!imageFound) {
          venue['image_url'] = _getCategoryPlaceholderImage(venueName);
        }
        
        venuesWithImages.add(venue);
      } catch (e) {
        debugPrint('Error getting image for venue: $e');
        // Add placeholder image even on error
        venue['image_url'] = _getCategoryPlaceholderImage(venue['name'] as String? ?? '');
        venuesWithImages.add(venue);
      }
    }

    return venuesWithImages;
  }

  Future<List<Map<String, dynamic>>> _addImagesToEvents(
    List<Map<String, dynamic>> events,
  ) async {
    final apiKey = dotenv.env['GOOGLE_MAPS_API_KEY'];
    if (apiKey == null) {
      // If no Google Maps API, add placeholder images to all events
      for (final event in events) {
        final eventName = event['name']?['text'] as String? ?? '';
        event['image_url'] = _getEventPlaceholderImage(eventName);
      }
      return events;
    }

    final eventsWithImages = <Map<String, dynamic>>[];

    for (final event in events.take(10)) {
      try {
        final eventName = event['name']?['text'] as String? ?? '';
        final venue = event['venue'] as Map<String, dynamic>? ?? {};
        final address = venue['address']?['localized_area_display'] as String? ?? '';

        // Try multiple search strategies for events
        final searchQueries = [
          '$eventName $address',
          eventName,
          '${event['organizer']?['name'] ?? ''} $eventName',
        ];

        bool imageFound = false;
        
        for (final searchQuery in searchQueries) {
          if (imageFound || searchQuery.trim().isEmpty) continue;
          
          try {
            final placeResponse = await http.get(
              Uri.parse('$_googleMapsBaseUrl/place/findplacefromtext/json')
                  .replace(queryParameters: {
                'input': searchQuery,
                'inputtype': 'textquery',
                'fields': 'place_id,photos',
                'key': apiKey,
              }),
            );

            if (placeResponse.statusCode == 200) {
              final placeData = json.decode(placeResponse.body);
              final candidates = placeData['candidates'] as List? ?? [];
              
              if (candidates.isNotEmpty) {
                final candidate = candidates.first as Map<String, dynamic>;
                final photos = candidate['photos'] as List? ?? [];
                
                if (photos.isNotEmpty) {
                  final photo = photos.first as Map<String, dynamic>;
                  final photoReference = photo['photo_reference'] as String?;
                  
                  if (photoReference != null) {
                    event['image_url'] = '$_googleMapsBaseUrl/place/photo?maxwidth=600&photoreference=$photoReference&key=$apiKey';
                    imageFound = true;
                    break;
                  }
                }
              }
            }
          } catch (e) {
            debugPrint('Error searching for event $searchQuery: $e');
            continue;
          }
          
          // Small delay to respect rate limits
          await Future.delayed(const Duration(milliseconds: 100));
        }

        // If still no image from Google Places, try venue location
        if (!imageFound && venue.isNotEmpty) {
          final lat = venue['latitude'] as double?;
          final lng = venue['longitude'] as double?;
          
          if (lat != null && lng != null) {
            event['image_url'] = '$_googleMapsBaseUrl/streetview?size=400x300&location=$lat,$lng&heading=235&pitch=10&key=$apiKey&fov=80';
            imageFound = true;
          }
        }
        
        // If still no image, use an event category-based placeholder
        if (!imageFound) {
          event['image_url'] = _getEventPlaceholderImage(eventName);
        }
        
        eventsWithImages.add(event);
      } catch (e) {
        debugPrint('Error getting image for event: $e');
        // Add placeholder image even on error
        event['image_url'] = _getEventPlaceholderImage(event['name']?['text'] as String? ?? '');
        eventsWithImages.add(event);
      }
    }

    return eventsWithImages;
  }

  String _getCategoryPlaceholderImage(String venueName) {
    final name = venueName.toLowerCase();
    
    // Generate placeholder based on venue type
    if (name.contains('restaurant') || name.contains('dining') || name.contains('cafe') || name.contains('food')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    } else if (name.contains('hotel') || name.contains('resort') || name.contains('accommodation')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
    } else if (name.contains('bar') || name.contains('lounge') || name.contains('club')) {
      return 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop';
    } else if (name.contains('spa') || name.contains('wellness') || name.contains('massage')) {
      return 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop';
    } else if (name.contains('park') || name.contains('garden') || name.contains('nature')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
    } else if (name.contains('museum') || name.contains('gallery') || name.contains('art')) {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    } else if (name.contains('beach') || name.contains('ocean') || name.contains('sea')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop';
    } else {
      // Generic luxury venue placeholder
      return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop';
    }
  }

  String _getEventPlaceholderImage(String eventName) {
    final name = eventName.toLowerCase();
    
    // Generate placeholder based on event type
    if (name.contains('music') || name.contains('concert') || name.contains('festival')) {
      return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop';
    } else if (name.contains('food') || name.contains('culinary') || name.contains('cooking')) {
      return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop';
    } else if (name.contains('art') || name.contains('gallery') || name.contains('exhibition')) {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    } else if (name.contains('dance') || name.contains('party') || name.contains('nightlife')) {
      return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop';
    } else if (name.contains('outdoor') || name.contains('adventure') || name.contains('sports')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
    } else if (name.contains('wellness') || name.contains('yoga') || name.contains('meditation')) {
      return 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop';
    } else {
      // Generic event placeholder
      return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop';
    }
  }

  Future<Map<String, dynamic>> _generateAIItinerary(
    String mood,
    List<Map<String, dynamic>> venues,
    List<Map<String, dynamic>> events,
    String cityName,
  ) async {
    final apiKey = dotenv.env['OPENAI_API_KEY'];
    if (apiKey == null) throw Exception('OpenAI API key not found');

    final moodDescription = _moodDescriptions[mood] ?? mood;

    // Create a simple list of venue and event names for context
    final venueNames = venues.map((v) => v['name'] as String? ?? '').where((name) => name.isNotEmpty).take(10).join(', ');
    final eventNames = events.map((e) => e['name']?['text'] as String? ?? '').where((name) => name.isNotEmpty).take(5).join(', ');

    final prompt = '''
Create a luxury travel itinerary for a $mood experience in $cityName.

Mood Context: $moodDescription

Available Venues: $venueNames
Available Events: $eventNames

Please create a JSON response with the following structure:
{
  "title": "A catchy title for the itinerary",
  "description": "A brief description of the experience",
  "activities": [
    {
      "title": "Activity name",
      "description": "Detailed description",
      "time": "Suggested time (e.g., Morning, Afternoon, Evening)",
      "venue": "Venue name from the available venues",
      "duration": "Estimated duration"
    }
  ],
  "tips": [
    "Luxury travel tip 1",
    "Luxury travel tip 2",
    "Luxury travel tip 3"
  ]
}

Focus on luxury experiences and include 4-6 activities that match the $mood mood. Use only venues and events from the provided lists.
''';

    try {
      final response = await http.post(
        Uri.parse('$_openaiBaseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'model': 'gpt-3.5-turbo',
          'messages': [
            {
              'role': 'system',
              'content': 'You are a luxury travel concierge assistant. Create detailed, sophisticated itineraries that focus on premium experiences.',
            },
            {
              'role': 'user',
              'content': prompt,
            },
          ],
          'max_tokens': 1500,
          'temperature': 0.7,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final content = data['choices'][0]['message']['content'] as String;
        
        // Try to parse JSON from the response
        try {
          final itinerary = json.decode(content) as Map<String, dynamic>;
          return itinerary;
        } catch (e) {
          // If JSON parsing fails, create a fallback response
          return _createFallbackItinerary(mood, cityName, venues, events);
        }
      } else {
        return _createFallbackItinerary(mood, cityName, venues, events);
      }
    } catch (e) {
      debugPrint('Error generating AI itinerary: $e');
      return _createFallbackItinerary(mood, cityName, venues, events);
    }
  }

  Map<String, dynamic> _createFallbackItinerary(
    String mood,
    String cityName,
    List<Map<String, dynamic>> venues,
    List<Map<String, dynamic>> events,
  ) {
    final topVenues = venues.take(4).toList();
    final activities = <Map<String, dynamic>>[];

    for (int i = 0; i < topVenues.length; i++) {
      final venue = topVenues[i];
      final venueName = venue['name'] as String? ?? 'Venue';
      activities.add({
        'title': 'Experience $venueName',
        'description': 'Enjoy a luxury experience at this ${mood.toLowerCase()} venue.',
        'time': i < 2 ? 'Morning' : i < 3 ? 'Afternoon' : 'Evening',
        'venue': venueName,
        'duration': '2-3 hours',
      });
    }

    return {
      'title': '$mood Experience in $cityName',
      'description': _moodDescriptions[mood] ?? 'A curated luxury experience.',
      'activities': activities,
      'tips': [
        'Make reservations in advance for the best experience',
        'Dress elegantly to match the luxury atmosphere',
        'Consider hiring a local guide for insider knowledge',
      ],
    };
  }
}
