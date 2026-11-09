"""
Convert Keras model to TensorFlow.js format
"""

import tensorflowjs as tfjs
import tensorflow as tf
import os

def convert_model(keras_model_path='quality_check_model.h5', 
                 output_dir='quality_check_model'):
    """
    Convert Keras model to TensorFlow.js
    
    Args:
        keras_model_path: Path to .h5 model file
        output_dir: Output directory for TensorFlow.js model
    """
    
    print("🔄 Converting model to TensorFlow.js format...\n")
    
    # Check if model exists
    if not os.path.exists(keras_model_path):
        print(f"❌ Error: {keras_model_path} not found!")
        return
    
    # Load Keras model
    print(f"📂 Loading model from {keras_model_path}")
    model = tf.keras.models.load_model(keras_model_path)
    
    # Convert to TensorFlow.js
    print(f"💾 Converting to TensorFlow.js...")
    tfjs.converters.save_keras_model(model, output_dir)
    
    print(f"\n✅ Model converted successfully!")
    print(f"📁 Output directory: {output_dir}/")
    print(f"\nFiles created:")
    
    # List files
    for file in os.listdir(output_dir):
        file_size = os.path.getsize(os.path.join(output_dir, file))
        print(f"  - {file} ({file_size / 1024:.2f} KB)")
    
    print("\n🚀 Next steps:")
    print("1. Copy all files to: backend/ai_models/quality_check_model/")
    print("2. Restart backend server")
    print("3. Model will be loaded automatically!")

if __name__ == '__main__':
    convert_model()
