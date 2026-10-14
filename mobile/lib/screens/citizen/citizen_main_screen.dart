import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import 'citizen_home_tab.dart';
import 'report_waste_screen.dart';
import 'ecopoints_wallet_tab.dart';
import 'my_reports_tab.dart';
import 'profile_tab.dart';
import 'waste_scanner_screen.dart';

class CitizenMainScreen extends StatefulWidget {
  const CitizenMainScreen({super.key});

  @override
  State<CitizenMainScreen> createState() => _CitizenMainScreenState();
}

class _CitizenMainScreenState extends State<CitizenMainScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    CitizenHomeTab(),
    ReportWasteScreen(),
    EcopointsWalletTab(),
    MyReportsTab(),
    ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
        },
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_filled),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_location_alt_outlined),
            activeIcon: Icon(Icons.add_location_alt),
            label: 'Report',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.eco_outlined),
            activeIcon: Icon(Icons.eco),
            label: 'EcoPoints',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_rounded),
            activeIcon: Icon(Icons.history_toggle_off),
            label: 'Activity',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const WasteScannerScreen()),
                );
              },
              backgroundColor: AppColors.emeraldPrimary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.camera_alt_outlined),
              label: const Text(
                'AI Scanner',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            )
          : null,
    );
  }
}
