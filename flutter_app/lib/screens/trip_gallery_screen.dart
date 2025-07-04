import 'package:flutter/material.dart';
import '../theme.dart';

class TripGalleryScreen extends StatelessWidget {
  final void Function()? onTripTap;
  const TripGalleryScreen({super.key, this.onTripTap});

  @override
  Widget build(BuildContext context) {
    // Example trip data
    final trips = List.generate(8, (i) => {
      'city': 'City  2${i+1}',
      'mood': Icons.favorite,
      'dates': '2024-06-0${i+1} to 2024-06-1${i+1}',
      'image': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    });
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: trips.length,
      itemBuilder: (context, i) {
        final trip = trips[i];
        return GestureDetector(
          onTap: onTripTap,
          child: Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Image.network(
                    trip['image'] as String,
                    height: 110,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(trip['mood'] as IconData, color: DriftTheme.gold, size: 18),
                          const SizedBox(width: 6),
                          Text(trip['city'] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(trip['dates'] as String, style: const TextStyle(fontSize: 12, color: DriftTheme.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
