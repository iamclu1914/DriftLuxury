import 'package:flutter/material.dart';
import '../theme.dart';

class BuildItineraryScreen extends StatefulWidget {
  final String city;
  final List<Map<String, dynamic>> savedItems;
  final VoidCallback onBack;
  const BuildItineraryScreen({
    super.key,
    required this.city,
    required this.savedItems,
    required this.onBack,
  });

  @override
  State<BuildItineraryScreen> createState() => _BuildItineraryScreenState();
}

class _BuildItineraryScreenState extends State<BuildItineraryScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  int selectedDay = 1;
  final int numDays = 3;
  
  // Store items in the itinerary by day
  final Map<int, List<Map<String, dynamic>>> _itineraryItems = {};
  
  // Items not yet added to any day
  late List<Map<String, dynamic>> _savedItems;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _animationController.forward();
    
    // Initialize saved items
    _savedItems = List.from(widget.savedItems);
    
    // Initialize empty lists for each day
    for (int i = 1; i <= numDays; i++) {
      _itineraryItems[i] = [];
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  // Move an item to a specific day's itinerary
  void _moveItemToDay(Map<String, dynamic> item, int day) {
    setState(() {
      // Remove from saved items if it exists there
      _savedItems.removeWhere((element) => element['id'] == item['id']);
      
      // Remove from any day it might be in
      for (int i = 1; i <= numDays; i++) {
        _itineraryItems[i]?.removeWhere((element) => element['id'] == item['id']);
      }
      
      // Add to the target day
      _itineraryItems[day]?.add(item);
    });
  }
  
  void _removeFromItinerary(Map<String, dynamic> item, int day) {
    setState(() {
      _itineraryItems[day]?.removeWhere((element) => element['id'] == item['id']);
      _savedItems.add(item);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // App bar
            Padding(
              padding: const EdgeInsets.fromLTRB(24.0, 24.0, 24.0, 0.0),
              child: Row(
                children: [
                  SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(-0.2, 0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: _animationController,
                      curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
                    )),
                    child: FadeTransition(
                      opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                        CurvedAnimation(
                          parent: _animationController,
                          curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
                        ),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back_ios, color: DriftTheme.textPrimary),
                        onPressed: widget.onBack,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        iconSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, -0.2),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animationController,
                        curve: const Interval(0.1, 0.5, curve: Curves.easeOut),
                      )),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.1, 0.5, curve: Curves.easeOut),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Build Your Itinerary',
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: DriftTheme.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Serif',
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              widget.city,
                              style: const TextStyle(
                                color: DriftTheme.textMuted,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.share, color: DriftTheme.gold),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Sharing itinerary...'),
                          backgroundColor: DriftTheme.surface,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Day selector tabs
            SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.2),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: _animationController,
                curve: const Interval(0.2, 0.6, curve: Curves.easeOut),
              )),
              child: FadeTransition(
                opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                  CurvedAnimation(
                    parent: _animationController,
                    curve: const Interval(0.2, 0.6, curve: Curves.easeOut),
                  ),
                ),
                child: SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: numDays,
                    itemBuilder: (context, index) {
                      final day = index + 1;
                      final isSelected = day == selectedDay;
                      
                      return Padding(
                        padding: const EdgeInsets.only(right: 12.0),
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              selectedDay = day;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? DriftTheme.gold : DriftTheme.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected ? DriftTheme.gold : DriftTheme.surfaceHover,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              'Day $day',
                              style: TextStyle(
                                color: isSelected ? Colors.black : DriftTheme.textPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Day itinerary and saved items
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Day itinerary (Timeline view)
                  Expanded(
                    flex: 3,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(-0.1, 0),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animationController,
                        curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                      )),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                          ),
                        ),
                        child: DragTarget<Map<String, dynamic>>(
                          onAcceptWithDetails: (details) {
                            _moveItemToDay(details.data, selectedDay);
                          },
                          builder: (context, candidateData, rejectedData) {
                            final dayItems = _itineraryItems[selectedDay] ?? [];
                            
                            return Container(
                              margin: const EdgeInsets.only(left: 24),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),                                color: candidateData.isNotEmpty 
                                    ? DriftTheme.gold.withValues(alpha: 0.1)
                                    : Colors.transparent,
                              ),
                              child: dayItems.isEmpty
                                  ? Center(
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 24),
                                        child: Text(
                                          'Drag items here to add them to Day $selectedDay',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: candidateData.isNotEmpty
                                                ? DriftTheme.gold
                                                : DriftTheme.textMuted,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ),
                                    )
                                  : ListView.builder(
                                      padding: const EdgeInsets.all(16),
                                      itemCount: dayItems.length,
                                      itemBuilder: (context, index) {
                                        final item = dayItems[index];
                                        return Draggable<Map<String, dynamic>>(
                                          data: item,
                                          feedback: SizedBox(
                                            width: MediaQuery.of(context).size.width * 0.5,
                                            child: ItineraryItemCard(
                                              item: item,
                                              isDragging: true,
                                              onDelete: () {},
                                            ),
                                          ),
                                          childWhenDragging: Opacity(
                                            opacity: 0.5,
                                            child: ItineraryItemCard(
                                              item: item,
                                              onDelete: () {},
                                            ),
                                          ),
                                          child: ItineraryItemCard(
                                            item: item,
                                            onDelete: () => _removeFromItinerary(item, selectedDay),
                                          ),
                                        );
                                      },
                                    ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                  
                  // Saved items panel
                  Expanded(
                    flex: 2,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.1, 0),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animationController,
                        curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                      )),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                          ),
                        ),
                        child: Container(
                          margin: const EdgeInsets.fromLTRB(8, 0, 24, 0),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: DriftTheme.surface,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Saved Items',
                                style: TextStyle(
                                  color: DriftTheme.textPrimary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Expanded(
                                child: _savedItems.isEmpty
                                    ? const Center(
                                        child: Text(
                                          'No saved items',
                                          style: TextStyle(color: DriftTheme.textMuted),
                                        ),
                                      )
                                    : ListView.builder(
                                        padding: EdgeInsets.zero,
                                        itemCount: _savedItems.length,
                                        itemBuilder: (context, index) {
                                          final item = _savedItems[index];
                                          return Draggable<Map<String, dynamic>>(
                                            data: item,
                                            feedback: SizedBox(
                                              width: MediaQuery.of(context).size.width * 0.4,
                                              child: SavedItemCard(
                                                item: item,
                                                isDragging: true,
                                              ),
                                            ),
                                            childWhenDragging: Opacity(
                                              opacity: 0.5,
                                              child: SavedItemCard(item: item),
                                            ),
                                            child: SavedItemCard(item: item),
                                          );
                                        },
                                      ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Map preview
            SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.2),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: _animationController,
                curve: const Interval(0.5, 0.9, curve: Curves.easeOut),
              )),
              child: FadeTransition(
                opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                  CurvedAnimation(
                    parent: _animationController,
                    curve: const Interval(0.5, 0.9, curve: Curves.easeOut),
                  ),
                ),
                child: Container(
                  height: 120,
                  margin: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: DriftTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          color: DriftTheme.surfaceVariant,
                          child: const Center(
                            child: Icon(
                              Icons.map,
                              size: 40,
                              color: DriftTheme.textMuted,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: DriftTheme.gold,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'View Full Map',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: DriftTheme.gold,
        foregroundColor: Colors.black,
        onPressed: () {
          // Add new activity button
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Add new activity feature coming soon'),
              backgroundColor: DriftTheme.surface,
            ),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class ItineraryItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onDelete;
  final bool isDragging;

  const ItineraryItemCard({
    super.key,
    required this.item,
    required this.onDelete,
    this.isDragging = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(        color: isDragging ? DriftTheme.gold.withValues(alpha: 0.2) : DriftTheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: isDragging
            ? [
                BoxShadow(
                  color: DriftTheme.gold.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          // Time indicator
          Container(
            width: 50,
            padding: const EdgeInsets.all(8),
            child: const Column(
              children: [
                Text(
                  '12:00',
                  style: TextStyle(
                    color: DriftTheme.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'PM',
                  style: TextStyle(
                    color: DriftTheme.textMuted,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
            child: Image.network(
              item['imageUrl'],
              width: 60,
              height: 60,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 60,
                  height: 60,
                  color: DriftTheme.surfaceVariant,
                  child: const Icon(
                    Icons.image,
                    color: DriftTheme.textMuted,
                  ),
                );
              },
            ),
          ),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'],
                    style: const TextStyle(
                      color: DriftTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item['description'],
                    style: const TextStyle(
                      color: DriftTheme.textMuted,
                      fontSize: 12,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          // Delete button
          IconButton(
            icon: const Icon(Icons.close, size: 16),
            color: DriftTheme.textMuted,
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class SavedItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final bool isDragging;

  const SavedItemCard({
    super.key,
    required this.item,
    this.isDragging = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(        color: isDragging ? DriftTheme.gold.withValues(alpha: 0.2) : DriftTheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        boxShadow: isDragging
            ? [
                BoxShadow(
                  color: DriftTheme.gold.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
            child: Image.network(
              item['imageUrl'],
              width: 50,
              height: 50,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 50,
                  height: 50,
                  color: DriftTheme.surfaceHover,
                  child: const Icon(
                    Icons.image,
                    color: DriftTheme.textMuted,
                    size: 20,
                  ),
                );
              },
            ),
          ),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'],
                    style: const TextStyle(
                      color: DriftTheme.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item['category'],
                    style: const TextStyle(
                      color: DriftTheme.gold,
                      fontSize: 10,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          // Drag handle
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Icon(
              Icons.drag_indicator,
              color: DriftTheme.textMuted,
              size: 16,
            ),
          ),
        ],
      ),
    );
  }
}
