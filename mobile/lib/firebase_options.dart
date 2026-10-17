import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for Waste2Worth AI
/// Generated for Firebase project: waste2worth-ai-d5b44
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyB_KP_7JmfVOZNSWu-GRnztYWdQXRY1yL8',
    appId: '1:412366498671:web:45f657b71300f8daff169a',
    messagingSenderId: '412366498671',
    projectId: 'waste2worth-ai-d5b44',
    authDomain: 'waste2worth-ai-d5b44.firebaseapp.com',
    storageBucket: 'waste2worth-ai-d5b44.firebasestorage.app',
    measurementId: 'G-7MMHW2V3V4',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyB_KP_7JmfVOZNSWu-GRnztYWdQXRY1yL8',
    appId: '1:412366498671:android:45f657b71300f8daff169a',
    messagingSenderId: '412366498671',
    projectId: 'waste2worth-ai-d5b44',
    storageBucket: 'waste2worth-ai-d5b44.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyB_KP_7JmfVOZNSWu-GRnztYWdQXRY1yL8',
    appId: '1:412366498671:ios:45f657b71300f8daff169a',
    messagingSenderId: '412366498671',
    projectId: 'waste2worth-ai-d5b44',
    storageBucket: 'waste2worth-ai-d5b44.firebasestorage.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyB_KP_7JmfVOZNSWu-GRnztYWdQXRY1yL8',
    appId: '1:412366498671:ios:45f657b71300f8daff169a',
    messagingSenderId: '412366498671',
    projectId: 'waste2worth-ai-d5b44',
    storageBucket: 'waste2worth-ai-d5b44.firebasestorage.app',
  );
}
