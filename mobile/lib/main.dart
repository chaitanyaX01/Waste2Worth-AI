import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/api_constants.dart';
import 'models/user_model.dart';
import 'providers/auth_provider.dart';
import 'providers/reports_provider.dart';
import 'providers/rewards_provider.dart';
import 'providers/tasks_provider.dart';
import 'providers/predictions_provider.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/citizen/citizen_main_screen.dart';
import 'screens/collector/collector_main_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'screens/admin/admin_mobile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase initialization notice: $e');
  }

  await ApiConstants.loadSavedBaseUrl();

  final authProvider = AuthProvider();
  await authProvider.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => ReportsProvider()),
        ChangeNotifierProvider(create: (_) => RewardsProvider()),
        ChangeNotifierProvider(create: (_) => TasksProvider()),
        ChangeNotifierProvider(create: (_) => PredictionsProvider()),
      ],
      child: const Waste2WorthApp(),
    ),
  );
}

class Waste2WorthApp extends StatelessWidget {
  const Waste2WorthApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Waste2Worth',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const RootScreenDecider(),
    );
  }
}

class RootScreenDecider extends StatelessWidget {
  const RootScreenDecider({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (!auth.isAuthenticated) {
      return const WelcomeScreen();
    }

    switch (auth.currentRole) {
      case UserRole.citizen:
        return const CitizenMainScreen();
      case UserRole.collector:
        return const CollectorMainScreen();
      case UserRole.admin:
        return const AdminMobileScreen();
    }
  }
}
