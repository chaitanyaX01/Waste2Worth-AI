class AIPredictionResult {
  final bool success;
  final String predictedClass;
  final double confidence;
  final double confidencePercent;
  final Map<String, double> allPredictions;
  final String modelVersion;

  AIPredictionResult({
    required this.success,
    required this.predictedClass,
    required this.confidence,
    required this.confidencePercent,
    required this.allPredictions,
    required this.modelVersion,
  });

  factory AIPredictionResult.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> rawPredictions =
        json['all_predictions'] is Map<String, dynamic>
            ? json['all_predictions'] as Map<String, dynamic>
            : {};

    final Map<String, double> parsedAll = {};
    rawPredictions.forEach((key, value) {
      if (value is num) {
        parsedAll[key] = value.toDouble();
      } else {
        parsedAll[key] = double.tryParse(value.toString()) ?? 0.0;
      }
    });

    final conf = json['confidence'] is num
        ? (json['confidence'] as num).toDouble()
        : double.tryParse(json['confidence']?.toString() ?? '0') ?? 0.0;

    final confPct = json['confidence_percent'] is num
        ? (json['confidence_percent'] as num).toDouble()
        : conf * 100.0;

    return AIPredictionResult(
      success: json['success'] ?? true,
      predictedClass: json['prediction']?.toString() ??
          json['predicted_class']?.toString() ??
          'Unknown',
      confidence: conf,
      confidencePercent: confPct,
      allPredictions: parsedAll,
      modelVersion: json['model_version']?.toString() ?? 'ResNet18-Waste2Worth-v1.0',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'prediction': predictedClass,
      'confidence': confidence,
      'confidence_percent': confidencePercent,
      'all_predictions': allPredictions,
      'model_version': modelVersion,
    };
  }
}
