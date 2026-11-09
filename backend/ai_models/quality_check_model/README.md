# Quality Check AI Model

## Model Information
- **Framework**: TensorFlow.js
- **Input**: 224x224 RGB images
- **Output**: 6 classes (crack, misalignment, poor_plastering, surface_defect, no_safety_gear, good_quality)
- **Architecture**: MobileNetV2 (or custom CNN)

## Training Data Required
- Minimum 1000 images per class
- Balanced dataset
- Various lighting conditions
- Different construction sites

## How to Add Your Model

1. **Train your model** using Python TensorFlow/Keras
2. **Convert to TensorFlow.js format**:
