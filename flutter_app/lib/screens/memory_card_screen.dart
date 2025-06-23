import 'package:flutter/material.dart';
import '../theme.dart';

class MemoryCardScreen extends StatelessWidget {
  final VoidCallback? onShare;
  const MemoryCardScreen({super.key, this.onShare});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      appBar: AppBar(
        backgroundColor: DriftTheme.background,
        elevation: 0,
        title: const Text('Trip Memories', style: TextStyle(color: DriftTheme.textPrimary)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: DriftTheme.gold),
            onPressed: onShare,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Row(
            children: [              Chip(label: const Text('Relaxed'), backgroundColor: DriftTheme.gold.withValues(alpha: 0.2)),
              const SizedBox(width: 8),
              Chip(label: const Text('Romantic'), backgroundColor: DriftTheme.gold.withValues(alpha: 0.2)),
            ],
          ),
          const SizedBox(height: 16),
          Text('Trip to Paris', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text('June 1 - June 7, 2024', style: TextStyle(color: DriftTheme.textMuted)),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 5,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, i) => ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
                  width: 120,
                  height: 120,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('Saved Spots', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...List.generate(3, (i) => ListTile(
            leading: const Icon(Icons.place, color: DriftTheme.gold),
            title: Text('Spot ${i+1}'),
            subtitle: const Text('A memorable place.'),
          )),
          const SizedBox(height: 24),
          Text('Trip Notes', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          const TextField(
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Write your story...'
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: DriftTheme.gold, foregroundColor: Colors.black),
                child: const Text('Turn Into Reel'),
              ),
              const SizedBox(width: 16),
              ElevatedButton(
                onPressed: onShare,
                style: ElevatedButton.styleFrom(backgroundColor: DriftTheme.surface, foregroundColor: DriftTheme.gold),
                child: const Text('Share on Feed'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
