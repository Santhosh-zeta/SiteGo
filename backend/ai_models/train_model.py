"""
Quality Check Model Training Script
Train a CNN model for construction defect detection
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs

# Define model
def create_model():
    model = keras.Sequential([
        # Input layer
        layers.Input(shape=(224, 224, 3)),
        
        # Convolutional layers
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Flatten and dense layers
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(6, activation='softmax')  # 6 classes
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# Train model (add your training data)
def train_model():
    model = create_model()
    """
Train Quality Check Model for Construction Site Monitoring
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json
import os

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
NUM_CLASSES = 6

CLASSES = [
    'crack',
    'misalignment',
    'poor_plastering',
    'surface_defect',
    'no_safety_gear',
    'good_quality'
]

def create_data_generators(dataset_dir='dataset'):
    """Create data generators with augmentation"""
    
    # Training data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    # Validation data (only rescaling)
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    # Load training data
    train_generator = train_datagen.flow_from_directory(
        os.path.join(dataset_dir, 'train'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASSES
    )
    
    # Load validation data
    val_generator = val_datagen.flow_from_directory(
        os.path.join(dataset_dir, 'val'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASSES
    )
    
    return train_generator, val_generator

def create_model(use_pretrained=True):
    """
    Create CNN model for defect detection
    
    Args:
        use_pretrained: Use MobileNetV2 pretrained on ImageNet
    """
    
    if use_pretrained:
        # Use MobileNetV2 as base
        base_model = keras.applications.MobileNetV2(
            input_shape=(IMG_SIZE, IMG_SIZE, 3),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False  # Freeze base model
        
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(NUM_CLASSES, activation='softmax')
        ])
    else:
        # Build custom CNN
        model = keras.Sequential([
            layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3)),
            
            # Block 1
            layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Block 2
            layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Block 3
            layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Block 4
            layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Dense layers
            layers.Flatten(),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(NUM_CLASSES, activation='softmax')
        ])
    
    return model

def train_model(dataset_dir='dataset', use_pretrained=True):
    """Train the model"""
    
    print("🚀 Starting model training...\n")
    
    # Create data generators
    print("📂 Loading dataset...")
    train_gen, val_gen = create_data_generators(dataset_dir)
    
    print(f"✅ Training samples: {train_gen.samples}")
    print(f"✅ Validation samples: {val_gen.samples}\n")
    
    # Create model
    print("🏗️  Building model...")
    model = create_model(use_pretrained=use_pretrained)
    model.summary()
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'Precision', 'Recall']
    )
    
    # Callbacks
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            'best_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            verbose=1
        )
    ]
    
    # Train model
    print("\n🎯 Training model...")
    history = model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    model.save('quality_check_model.h5')
    print("\n✅ Model saved as 'quality_check_model.h5'")
    
    # Save training history
    with open('training_history.json', 'w') as f:
        history_dict = {k: [float(v) for v in values] 
                       for k, values in history.history.items()}
        json.dump(history_dict, f, indent=2)
    
    return model, history

def evaluate_model(model, dataset_dir='dataset'):
    """Evaluate model on test set"""
    
    print("\n📊 Evaluating model on test set...")
    
    test_datagen = ImageDataGenerator(rescale=1./255)
    test_generator = test_datagen.flow_from_directory(
        os.path.join(dataset_dir, 'test'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASSES,
        shuffle=False
    )
    
    # Evaluate
    results = model.evaluate(test_generator)
    
    print("\n📈 Test Results:")
    print(f"  Loss: {results[0]:.4f}")
    print(f"  Accuracy: {results[1]:.4f}")
    print(f"  Precision: {results[2]:.4f}")
    print(f"  Recall: {results[3]:.4f}")
    
    return results

if __name__ == '__main__':
    print("🏗️  SiteGo Quality Check Model Training\n")
    
    # Check if dataset exists
    if not os.path.exists('dataset/train'):
        print("❌ Error: Dataset not found!")
        print("Please run 'prepare_dataset.py' first.")
        exit(1)
    
    # Train model
    model, history = train_model(
        dataset_dir='dataset',
        use_pretrained=True  # Set False for custom CNN
    )
    
    # Evaluate model
    evaluate_model(model, dataset_dir='dataset')
    
    print("\n🎉 Training completed!")
    print("\nNext steps:")
    print("1. Run 'convert_to_tfjs.py' to convert to TensorFlow.js")
    print("2. Copy files to '../backend/ai_models/quality_check_model/'")

    # TODO: Load your training data
    # train_data = load_training_data()
    # model.fit(train_data, epochs=50, validation_split=0.2)
    
    # Save as Keras model
    model.save('quality_check_model.h5')
    
    # Convert to TensorFlow.js
    tfjs.converters.save_keras_model(model, './quality_check_model/')
    
    print("Model trained and converted successfully!")

if __name__ == '__main__':
    train_model()
