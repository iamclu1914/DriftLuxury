import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../theme.dart';

class ConciergeScreen extends StatefulWidget {
  final void Function(String request)? onRequest;
  const ConciergeScreen({super.key, this.onRequest});

  @override
  State<ConciergeScreen> createState() => _ConciergeScreenState();
}

class _ConciergeScreenState extends State<ConciergeScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _showRecommendations = false;
  bool _isLoading = false;
  String? _chatResponse;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: DriftTheme.gold.withValues(alpha: 0.2),
                    child: const Icon(Icons.support_agent, color: DriftTheme.gold, size: 36),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Ask Drift Concierge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                        SizedBox(height: 4),
                        Text('How can I help you today?', style: TextStyle(color: DriftTheme.textMuted)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ElevatedButton(
                      onPressed: () => _handleQuickRequest('Find me a dinner spot'),
                      style: ElevatedButton.styleFrom(backgroundColor: DriftTheme.gold, foregroundColor: Colors.black),
                      child: const Text('Find me a dinner spot'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () => _handleQuickRequest('Plan a romantic weekend'),
                      style: ElevatedButton.styleFrom(backgroundColor: DriftTheme.surface, foregroundColor: DriftTheme.gold),
                      child: const Text('Plan a romantic weekend'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.mood, color: DriftTheme.gold),
                  SizedBox(width: 8),
                  Text('Mood: Relaxed'),
                  SizedBox(width: 16),
                  Icon(Icons.location_on, color: DriftTheme.gold),
                  SizedBox(width: 8),
                  Text('Location: Paris'),
                ],
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _controller,
                decoration: const InputDecoration(
                  hintText: 'Type your request...'
                ),
                onSubmitted: (value) => _handleRequest(value),
              ),
              const SizedBox(height: 24),
              if (_showRecommendations) ...[
                const Text('Recommendations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 16),
                _buildRecommendationCard('Le Gourmet', 'A luxury French restaurant with a romantic ambiance.'),
                _buildRecommendationCard('Weekend at Ritz', 'Stay at the Ritz Paris for a romantic getaway.'),
                _buildRecommendationCard('Seine River Cruise', 'Enjoy a private cruise with dinner and live music.'),
              ],
              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(child: CircularProgressIndicator(color: DriftTheme.gold)),
                ),
              if (_chatResponse != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Text(_chatResponse!, style: const TextStyle(fontSize: 16, color: DriftTheme.textPrimary)),
                ),
            ],
          ),
        ),
      ),
    );
  }
  void _handleQuickRequest(String request) {
    setState(() {
      _controller.text = request;
      _showRecommendations = true;
    });
    widget.onRequest?.call(request);
  }
  void _handleRequest(String request) async {
    setState(() {
      _showRecommendations = false;
      _isLoading = true;
      _chatResponse = null;
    });
    widget.onRequest?.call(request);
    final apiKey = dotenv.env['OPENAI_API_KEY'];
    if (apiKey == null) {
      setState(() {
        _isLoading = false;
        _chatResponse = 'OpenAI API key not found.';
      });
      return;
    }
    final response = await http.post(
      Uri.parse('https://api.openai.com/v1/chat/completions'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode({
        'model': 'gpt-3.5-turbo',
        'messages': [
          {'role': 'system', 'content': 'You are a luxury travel concierge.'},
          {'role': 'user', 'content': request},
        ],
        'max_tokens': 200,
        'temperature': 0.7,
      }),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final content = data['choices'][0]['message']['content'];
      setState(() {
        _isLoading = false;
        _chatResponse = content;
      });
    } else {
      setState(() {
        _isLoading = false;
        _chatResponse = 'Failed to get response from OpenAI.';
      });
    }
  }

  Widget _buildRecommendationCard(String title, String summary) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Text(summary, style: const TextStyle(color: DriftTheme.textMuted)),
            const SizedBox(height: 12),
            Row(
              children: [
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(backgroundColor: DriftTheme.gold, foregroundColor: Colors.black),
                  child: const Text('Book'),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(foregroundColor: DriftTheme.gold),
                  child: const Text('Save'),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(foregroundColor: DriftTheme.gold),
                  child: const Text('Add to Itinerary'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
