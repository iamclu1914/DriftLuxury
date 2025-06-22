import 'package:flutter/material.dart';
import '../theme.dart';

class ShareSheetScreen extends StatelessWidget {
  const ShareSheetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: DriftTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Share Trip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.public, color: DriftTheme.gold),
            title: const Text('Post to Drift Feed'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.picture_as_pdf, color: DriftTheme.gold),
            title: const Text('Download as PDF'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.send, color: DriftTheme.gold),
            title: const Text('Send to Friends'),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
