import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/task_model.dart';
import '../services/api_service.dart';

class TasksProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<CollectionTaskModel> _tasks = [];
  bool _isLoading = false;
  bool _isUpdating = false;
  String? _errorMessage;

  List<CollectionTaskModel> get tasks => _tasks;
  bool get isLoading => _isLoading;
  bool get isUpdating => _isUpdating;
  String? get errorMessage => _errorMessage;

  List<CollectionTaskModel> get pendingTasks => _tasks
      .where((t) => t.status == CollectionTaskStatus.assigned)
      .toList();

  List<CollectionTaskModel> get inProgressTasks => _tasks
      .where((t) => t.status == CollectionTaskStatus.inProgress)
      .toList();

  List<CollectionTaskModel> get completedTasks => _tasks
      .where((t) =>
          t.status == CollectionTaskStatus.collected ||
          t.status == CollectionTaskStatus.completed)
      .toList();

  Future<void> fetchTasks({String? status}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _tasks = await _apiService.getCollectorTasks(status: status);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateTaskStatus({
    required String taskId,
    required String status,
    String? comment,
  }) async {
    _isUpdating = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updated = await _apiService.updateTaskStatus(
        taskId: taskId,
        status: status,
        comment: comment,
      );

      final index = _tasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        _tasks[index] = updated;
      }
      _isUpdating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isUpdating = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> uploadEvidence({
    required String taskId,
    required File imageFile,
    required String evidenceType,
    String? notes,
  }) async {
    _isUpdating = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _apiService.uploadCollectionEvidence(
        taskId: taskId,
        imageFile: imageFile,
        evidenceType: evidenceType,
        notes: notes,
      );
      // Re-fetch tasks to refresh evidence state
      await fetchTasks();
      _isUpdating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isUpdating = false;
      notifyListeners();
      return false;
    }
  }
}
