"""
Dataset Preparation for Quality Check Model
Organizes images into training/validation structure
"""

import os
import shutil
import random
from pathlib import Path

# Dataset structure
CLASSES = [
    'crack',
    'misalignment', 
    'poor_plastering',
    'surface_defect',
    'no_safety_gear',
    'good_quality'
]

def create_dataset_structure(base_path='dataset'):
    """Create train/val directory structure"""
    
    for split in ['train', 'val', 'test']:
        for class_name in CLASSES:
            path = os.path.join(base_path, split, class_name)
            os.makedirs(path, exist_ok=True)
            print(f"Created: {path}")
    
    print("\n✅ Dataset structure created!")
    print("\nNow organize your images:")
    print("- Place images in respective class folders under 'train/'")
    print("- Validation split will be created automatically")

def split_dataset(source_dir='raw_images', target_dir='dataset', 
                  train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
    """
    Split images into train/val/test sets
    
    Args:
        source_dir: Directory with raw images organized by class
        target_dir: Output directory for split dataset
        train_ratio: Percentage for training (0.7 = 70%)
        val_ratio: Percentage for validation
        test_ratio: Percentage for testing
    """
    
    for class_name in CLASSES:
        source_class_dir = os.path.join(source_dir, class_name)
        
        if not os.path.exists(source_class_dir):
            print(f"⚠️  Warning: {source_class_dir} not found, skipping...")
            continue
        
        # Get all images
        images = [f for f in os.listdir(source_class_dir) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        if len(images) == 0:
            print(f"⚠️  No images found in {source_class_dir}")
            continue
        
        # Shuffle images
        random.shuffle(images)
        
        # Calculate split indices
        total = len(images)
        train_end = int(total * train_ratio)
        val_end = train_end + int(total * val_ratio)
        
        # Split images
        train_images = images[:train_end]
        val_images = images[train_end:val_end]
        test_images = images[val_end:]
        
        # Copy to respective directories
        for img_list, split in [(train_images, 'train'), 
                                (val_images, 'val'), 
                                (test_images, 'test')]:
            for img in img_list:
                src = os.path.join(source_class_dir, img)
                dst_dir = os.path.join(target_dir, split, class_name)
                dst = os.path.join(dst_dir, img)
                shutil.copy2(src, dst)
        
        print(f"✅ {class_name}: {len(train_images)} train, "
              f"{len(val_images)} val, {len(test_images)} test")
    
    print("\n🎉 Dataset split completed!")

def validate_dataset(dataset_dir='dataset'):
    """Check dataset statistics"""
    
    print("\n📊 Dataset Statistics:")
    print("-" * 50)
    
    for split in ['train', 'val', 'test']:
        print(f"\n{split.upper()}:")
        total = 0
        
        for class_name in CLASSES:
            path = os.path.join(dataset_dir, split, class_name)
            count = len([f for f in os.listdir(path) 
                        if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
            total += count
            print(f"  {class_name:20s}: {count:4d} images")
        
        print(f"  {'Total':20s}: {total:4d} images")

if __name__ == '__main__':
    print("🏗️  SiteGo Quality Check Dataset Preparation\n")
    
    # Step 1: Create structure
    create_dataset_structure()
    
    # Step 2: If you have raw images, uncomment to split:
    # split_dataset(source_dir='raw_images', target_dir='dataset')
    
    # Step 3: Validate dataset
    # validate_dataset()
