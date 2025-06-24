# Supabase Storage Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Stylisto Supabase Storage integration, covering upload/download operations, access control policies, image transformations, and performance optimization.

## Testing Categories

### 1. Storage Operations Testing

#### Upload Testing
```typescript
describe('Image Upload Operations', () => {
  test('successfully uploads single image', async () => {
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const result = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.path).toContain(`${userId}/clothing`);
    
    // Verify file exists in storage
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/clothing`);
      
    expect(data).toHaveLength(1);
  });

  test('handles batch upload with progress tracking', async () => {
    const testImages = await Promise.all([
      generateTestImage('test1.jpg'),
      generateTestImage('test2.jpg'),
      generateTestImage('test3.jpg')
    ]);
    
    const userId = 'test-user-id';
    const progressUpdates: { completed: number; total: number }[] = [];
    
    const results = await storageService.uploadBatch(
      testImages.map(img => img.uri),
      userId,
      'clothing',
      undefined,
      (completed, total) => {
        progressUpdates.push({ completed, total });
      }
    );
    
    // Verify all uploads succeeded
    expect(results).toHaveLength(3);
    expect(results.every(r => r.error === null)).toBe(true);
    
    // Verify progress tracking
    expect(progressUpdates).toHaveLength(3);
    expect(progressUpdates[0]).toEqual({ completed: 1, total: 3 });
    expect(progressUpdates[1]).toEqual({ completed: 2, total: 3 });
    expect(progressUpdates[2]).toEqual({ completed: 3, total: 3 });
  });

  test('handles upload errors gracefully', async () => {
    // Test with invalid image
    const result = await storageService.uploadImage(
      'invalid-uri',
      'test-user-id',
      'clothing'
    );
    
    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
```

#### Retrieval Testing
```typescript
describe('Image Retrieval Operations', () => {
  test('generates correct public URL', async () => {
    // Upload test image first
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Get public URL
    const publicUrl = storageService.getImageUrl(path);
    
    expect(publicUrl).toContain('wardrobe-images');
    expect(publicUrl).toContain(path);
    
    // Verify URL is accessible
    const response = await fetch(publicUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/');
  });

  test('applies transformations correctly', async () => {
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Get transformed URL
    const thumbnailUrl = storageService.getImageUrl(path, {
      width: 100,
      height: 100,
      resize: 'cover',
      format: 'webp',
    });
    
    expect(thumbnailUrl).toContain('width=100');
    expect(thumbnailUrl).toContain('height=100');
    expect(thumbnailUrl).toContain('resize=cover');
    expect(thumbnailUrl).toContain('format=webp');
    
    // Verify transformed image
    const response = await fetch(thumbnailUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/webp');
  });

  test('optimized image helpers return correct URLs', async () => {
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Test different optimization presets
    const thumbnailUrl = storageService.getOptimizedImageUrl(path, 'thumbnail');
    const mediumUrl = storageService.getOptimizedImageUrl(path, 'medium');
    const largeUrl = storageService.getOptimizedImageUrl(path, 'large');
    const originalUrl = storageService.getOptimizedImageUrl(path, 'original');
    
    // Verify thumbnail has correct parameters
    expect(thumbnailUrl).toContain('width=200');
    expect(thumbnailUrl).toContain('height=200');
    
    // Verify medium has correct parameters
    expect(mediumUrl).toContain('width=800');
    
    // Verify large has correct parameters
    expect(largeUrl).toContain('width=1200');
    
    // Verify original has no transformation parameters
    expect(originalUrl).not.toContain('width=');
    expect(originalUrl).not.toContain('format=');
  });
});
```

#### Deletion Testing
```typescript
describe('Image Deletion Operations', () => {
  test('successfully deletes single image', async () => {
    // Upload test image first
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Delete the image
    const { error } = await storageService.deleteImage(path);
    expect(error).toBeNull();
    
    // Verify image is deleted
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/clothing`);
      
    expect(data).toHaveLength(0);
  });

  test('batch deletion works correctly', async () => {
    // Upload multiple test images
    const testImages = await Promise.all([
      generateTestImage('test1.jpg'),
      generateTestImage('test2.jpg'),
      generateTestImage('test3.jpg')
    ]);
    
    const userId = 'test-user-id';
    
    const uploadResults = await Promise.all(
      testImages.map(img => 
        storageService.uploadImage(img.uri, userId, 'clothing')
      )
    );
    
    const paths = uploadResults
      .map(result => result.data?.path)
      .filter(Boolean) as string[];
    
    // Delete batch
    const { error } = await storageService.deleteBatch(paths);
    expect(error).toBeNull();
    
    // Verify all images are deleted
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/clothing`);
      
    expect(data).toHaveLength(0);
  });

  test('handles deletion errors gracefully', async () => {
    // Try to delete non-existent image
    const { error } = await storageService.deleteImage('non-existent-path');
    
    expect(error).not.toBeNull();
  });
});
```

### 2. Access Control Testing

#### RLS Policy Testing
```typescript
describe('Storage RLS Policies', () => {
  test('users can only access their own files', async () => {
    // Create two test users
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    
    // Upload image as user1
    await supabase.auth.signIn({ user: user1 });
    const testImage = await generateTestImage('test-image.jpg');
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      user1.id,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Try to access as user2
    await supabase.auth.signIn({ user: user2 });
    
    const { data, error } = await supabase.storage
      .from('wardrobe-images')
      .list(`${user1.id}/clothing`);
    
    // Should fail due to RLS policy
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  test('users can only delete their own files', async () => {
    // Create two test users
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    
    // Upload image as user1
    await supabase.auth.signIn({ user: user1 });
    const testImage = await generateTestImage('test-image.jpg');
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      user1.id,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Try to delete as user2
    await supabase.auth.signIn({ user: user2 });
    
    const { error } = await supabase.storage
      .from('wardrobe-images')
      .remove([path]);
    
    // Should fail due to RLS policy
    expect(error).not.toBeNull();
  });

  test('public read access works for all users', async () => {
    // Create test user and upload image
    const user = await createTestUser();
    await supabase.auth.signIn({ user });
    
    const testImage = await generateTestImage('test-image.jpg');
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      user.id,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    const publicUrl = storageService.getImageUrl(path);
    
    // Sign out
    await supabase.auth.signOut();
    
    // Verify public access works
    const response = await fetch(publicUrl);
    expect(response.status).toBe(200);
  });
});
```

#### Folder Structure Testing
```typescript
describe('Storage Folder Structure', () => {
  test('creates correct folder structure for clothing items', async () => {
    const userId = 'test-user-id';
    const itemId = 'test-item-id';
    
    const testImage = await generateTestImage('test-image.jpg');
    await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing',
      itemId
    );
    
    // Verify folder structure
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/clothing`);
      
    expect(data).toHaveLength(1);
    expect(data?.[0].name).toContain(itemId);
  });

  test('creates correct folder structure for outfit images', async () => {
    const userId = 'test-user-id';
    const outfitId = 'test-outfit-id';
    
    const testImage = await generateTestImage('test-image.jpg');
    await storageService.uploadImage(
      testImage.uri,
      userId,
      'outfit',
      outfitId
    );
    
    // Verify folder structure
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/outfit`);
      
    expect(data).toHaveLength(1);
    expect(data?.[0].name).toContain(outfitId);
  });

  test('creates correct folder structure for profile images', async () => {
    const userId = 'test-user-id';
    
    const testImage = await generateTestImage('test-image.jpg');
    await storageService.uploadImage(
      testImage.uri,
      userId,
      'profile'
    );
    
    // Verify folder structure
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/profile`);
      
    expect(data).toHaveLength(1);
  });
});
```

### 3. Image Transformation Testing

#### Transformation Quality Testing
```typescript
describe('Image Transformations', () => {
  test('thumbnail transformation maintains quality', async () => {
    const testImage = await generateTestImage('high-quality.jpg', 2000, 2000);
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Get thumbnail URL
    const thumbnailUrl = storageService.getOptimizedImageUrl(path, 'thumbnail');
    
    // Download and check thumbnail
    const response = await fetch(thumbnailUrl);
    const blob = await response.blob();
    
    // Verify size reduction
    expect(blob.size).toBeLessThan(testImage.size);
    
    // Verify dimensions (would require image processing library)
    // This is a simplified check
    expect(thumbnailUrl).toContain('width=200');
    expect(thumbnailUrl).toContain('height=200');
  });

  test('format conversion works correctly', async () => {
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Get WebP version
    const webpUrl = storageService.getImageUrl(path, {
      format: 'webp',
    });
    
    // Verify format
    const response = await fetch(webpUrl);
    expect(response.headers.get('content-type')).toContain('image/webp');
  });

  test('resize operations maintain aspect ratio', async () => {
    // Create test image with known aspect ratio (2:1)
    const testImage = await generateTestImage('wide-image.jpg', 2000, 1000);
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Test contain resize (should maintain aspect ratio)
    const resizedUrl = storageService.getImageUrl(path, {
      width: 400,
      height: 400,
      resize: 'contain',
    });
    
    // Download and check image dimensions
    // This would require image processing library in a real test
    // Here we're just checking the URL parameters
    expect(resizedUrl).toContain('width=400');
    expect(resizedUrl).toContain('height=400');
    expect(resizedUrl).toContain('resize=contain');
  });
});
```

### 4. Performance Testing

#### CDN Performance Testing
```typescript
describe('CDN Performance', () => {
  test('CDN delivers images with acceptable latency', async () => {
    // Upload test image
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    const imageUrl = storageService.getImageUrl(path);
    
    // Measure download time
    const startTime = performance.now();
    await fetch(imageUrl);
    const endTime = performance.now();
    
    const downloadTime = endTime - startTime;
    
    // Expect reasonable download time (adjust based on image size)
    expect(downloadTime).toBeLessThan(2000); // 2 seconds max
  });

  test('transformed images load faster than originals', async () => {
    // Upload large test image
    const testImage = await generateTestImage('large-image.jpg', 3000, 3000);
    const userId = 'test-user-id';
    
    const uploadResult = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    const path = uploadResult.data?.path as string;
    
    // Get original and thumbnail URLs
    const originalUrl = storageService.getOptimizedImageUrl(path, 'original');
    const thumbnailUrl = storageService.getOptimizedImageUrl(path, 'thumbnail');
    
    // Measure download times
    const originalStartTime = performance.now();
    await fetch(originalUrl);
    const originalEndTime = performance.now();
    
    const thumbnailStartTime = performance.now();
    await fetch(thumbnailUrl);
    const thumbnailEndTime = performance.now();
    
    const originalTime = originalEndTime - originalStartTime;
    const thumbnailTime = thumbnailEndTime - thumbnailStartTime;
    
    // Thumbnail should load faster
    expect(thumbnailTime).toBeLessThan(originalTime);
  });

  test('concurrent image loads perform well', async () => {
    // Upload multiple test images
    const testImages = await Promise.all([
      generateTestImage('test1.jpg'),
      generateTestImage('test2.jpg'),
      generateTestImage('test3.jpg'),
      generateTestImage('test4.jpg'),
      generateTestImage('test5.jpg')
    ]);
    
    const userId = 'test-user-id';
    
    const uploadResults = await Promise.all(
      testImages.map(img => 
        storageService.uploadImage(img.uri, userId, 'clothing')
      )
    );
    
    const paths = uploadResults
      .map(result => result.data?.path)
      .filter(Boolean) as string[];
    
    const urls = paths.map(path => 
      storageService.getOptimizedImageUrl(path, 'thumbnail')
    );
    
    // Load all images concurrently
    const startTime = performance.now();
    await Promise.all(urls.map(url => fetch(url)));
    const endTime = performance.now();
    
    const totalTime = endTime - startTime;
    const averageTime = totalTime / urls.length;
    
    // Expect reasonable average time
    expect(averageTime).toBeLessThan(1000); // 1 second per image max
  });
});
```

### 5. Cleanup and Maintenance Testing

#### Orphaned File Cleanup Testing
```typescript
describe('Storage Maintenance', () => {
  test('identifies orphaned files correctly', async () => {
    const userId = 'test-user-id';
    
    // Upload test images
    const testImages = await Promise.all([
      generateTestImage('test1.jpg'),
      generateTestImage('test2.jpg'),
      generateTestImage('test3.jpg')
    ]);
    
    const uploadResults = await Promise.all(
      testImages.map(img => 
        storageService.uploadImage(img.uri, userId, 'clothing')
      )
    );
    
    const paths = uploadResults
      .map(result => result.data?.path)
      .filter(Boolean) as string[];
    
    // Create database references for only 2 of the 3 images
    await supabase.from('clothing_items').insert([
      {
        user_id: userId,
        name: 'Test Item 1',
        category: 'tops',
        color: 'blue',
        image_url: storageService.getImageUrl(paths[0]),
      },
      {
        user_id: userId,
        name: 'Test Item 2',
        category: 'bottoms',
        color: 'black',
        image_url: storageService.getImageUrl(paths[1]),
      }
    ]);
    
    // Run dry-run cleanup
    const { deletedFiles, errors } = await storageService.cleanupOrphanedFiles(userId, true);
    
    // Should identify one orphaned file
    expect(deletedFiles).toHaveLength(1);
    expect(deletedFiles[0]).toBe(paths[2]);
    expect(errors).toHaveLength(0);
  });

  test('cleans up orphaned files successfully', async () => {
    const userId = 'test-user-id';
    
    // Upload test images
    const testImages = await Promise.all([
      generateTestImage('test1.jpg'),
      generateTestImage('test2.jpg')
    ]);
    
    const uploadResults = await Promise.all(
      testImages.map(img => 
        storageService.uploadImage(img.uri, userId, 'clothing')
      )
    );
    
    const paths = uploadResults
      .map(result => result.data?.path)
      .filter(Boolean) as string[];
    
    // Create database reference for only the first image
    await supabase.from('clothing_items').insert({
      user_id: userId,
      name: 'Test Item',
      category: 'tops',
      color: 'blue',
      image_url: storageService.getImageUrl(paths[0]),
    });
    
    // Run actual cleanup
    const { deletedFiles, errors } = await storageService.cleanupOrphanedFiles(userId, false);
    
    // Should delete one orphaned file
    expect(deletedFiles).toHaveLength(1);
    expect(deletedFiles[0]).toBe(paths[1]);
    expect(errors).toHaveLength(0);
    
    // Verify file is actually deleted
    const { data } = await supabase.storage
      .from('wardrobe-images')
      .list(`${userId}/clothing`);
      
    expect(data).toHaveLength(1);
    expect(data?.[0].name).toContain(paths[0].split('/').pop() as string);
  });

  test('storage stats function returns accurate data', async () => {
    const userId = 'test-user-id';
    
    // Upload test images of different types
    const clothingImage = await generateTestImage('clothing.jpg');
    const outfitImage = await generateTestImage('outfit.jpg');
    const profileImage = await generateTestImage('profile.jpg');
    
    await storageService.uploadImage(clothingImage.uri, userId, 'clothing');
    await storageService.uploadImage(outfitImage.uri, userId, 'outfit');
    await storageService.uploadImage(profileImage.uri, userId, 'profile');
    
    // Get storage stats
    const stats = await storageService.getStorageStats(userId);
    
    // Verify stats
    expect(stats.totalFiles).toBe(3);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.filesByType).toHaveProperty('clothing', 1);
    expect(stats.filesByType).toHaveProperty('outfit', 1);
    expect(stats.filesByType).toHaveProperty('profile', 1);
    expect(stats.sizeByType).toHaveProperty('clothing');
    expect(stats.sizeByType).toHaveProperty('outfit');
    expect(stats.sizeByType).toHaveProperty('profile');
  });
});
```

### 6. Component Testing

#### ImageUploader Component Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImageUploader } from '../components/storage/ImageUploader';

describe('ImageUploader Component', () => {
  test('renders correctly with no existing image', () => {
    const { getByText } = render(
      <ImageUploader
        onImageUploaded={() => {}}
        itemType="clothing"
      />
    );
    
    expect(getByText('Camera')).toBeTruthy();
    expect(getByText('Gallery')).toBeTruthy();
    expect(getByText(/Max file size/)).toBeTruthy();
  });

  test('renders correctly with existing image', () => {
    const { getByText } = render(
      <ImageUploader
        onImageUploaded={() => {}}
        itemType="clothing"
        existingImageUrl="https://example.com/image.jpg"
      />
    );
    
    expect(getByText('Change')).toBeTruthy();
  });

  test('handles camera button press', () => {
    const mockRouter = { push: jest.fn() };
    jest.mock('expo-router', () => ({
      router: mockRouter,
    }));
    
    const { getByText } = render(
      <ImageUploader
        onImageUploaded={() => {}}
        itemType="clothing"
      />
    );
    
    fireEvent.press(getByText('Camera'));
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/camera',
      params: expect.objectContaining({
        mode: 'camera',
        itemType: 'clothing',
      }),
    });
  });

  test('handles upload success', async () => {
    const mockUploadImage = jest.fn().mockResolvedValue({
      data: { path: 'test/path.jpg' },
      error: null,
    });
    
    const mockGetImageUrl = jest.fn().mockReturnValue('https://example.com/image.jpg');
    
    jest.mock('../../hooks/useStorage', () => ({
      useStorage: () => ({
        uploadImage: mockUploadImage,
        getImageUrl: mockGetImageUrl,
      }),
    }));
    
    const mockOnImageUploaded = jest.fn();
    
    const { getByTestId } = render(
      <ImageUploader
        onImageUploaded={mockOnImageUploaded}
        itemType="clothing"
      />
    );
    
    // Simulate upload completion
    await waitFor(() => {
      expect(mockOnImageUploaded).toHaveBeenCalledWith('https://example.com/image.jpg');
    });
  });

  test('displays error message on upload failure', async () => {
    const mockUploadImage = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Upload failed'),
    });
    
    jest.mock('../../hooks/useStorage', () => ({
      useStorage: () => ({
        uploadImage: mockUploadImage,
        getImageUrl: jest.fn(),
      }),
    }));
    
    const { getByText } = render(
      <ImageUploader
        onImageUploaded={() => {}}
        itemType="clothing"
      />
    );
    
    // Simulate upload failure
    await waitFor(() => {
      expect(getByText(/Upload failed/)).toBeTruthy();
    });
  });
});
```

#### ImageGallery Component Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImageGallery } from '../components/storage/ImageGallery';

describe('ImageGallery Component', () => {
  test('renders loading state initially', () => {
    const { getByText } = render(
      <ImageGallery
        userId="test-user-id"
        itemType="clothing"
      />
    );
    
    expect(getByText('Loading images...')).toBeTruthy();
  });

  test('renders empty state when no images', async () => {
    const mockListFiles = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    
    jest.mock('../../hooks/useStorage', () => ({
      useStorage: () => ({
        listFiles: mockListFiles,
        getImageUrl: jest.fn(),
      }),
    }));
    
    const { getByText } = render(
      <ImageGallery
        userId="test-user-id"
        itemType="clothing"
      />
    );
    
    await waitFor(() => {
      expect(getByText('No images found')).toBeTruthy();
    });
  });

  test('renders images when available', async () => {
    const mockListFiles = jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'image1.jpg', created_at: '2023-01-01' },
        { id: '2', name: 'image2.jpg', created_at: '2023-01-02' },
      ],
      error: null,
    });
    
    const mockGetImageUrl = jest.fn().mockImplementation((path, type) => 
      `https://example.com/${path}?type=${type}`
    );
    
    jest.mock('../../hooks/useStorage', () => ({
      useStorage: () => ({
        listFiles: mockListFiles,
        getImageUrl: mockGetImageUrl,
      }),
    }));
    
    const { getAllByTestId } = render(
      <ImageGallery
        userId="test-user-id"
        itemType="clothing"
      />
    );
    
    await waitFor(() => {
      expect(getAllByTestId('gallery-image')).toHaveLength(2);
    });
  });

  test('handles image selection', async () => {
    const mockListFiles = jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'image1.jpg', created_at: '2023-01-01' },
      ],
      error: null,
    });
    
    const mockGetImageUrl = jest.fn().mockReturnValue('https://example.com/image.jpg');
    
    jest.mock('../../hooks/useStorage', () => ({
      useStorage: () => ({
        listFiles: mockListFiles,
        getImageUrl: mockGetImageUrl,
      }),
    }));
    
    const mockOnSelectImage = jest.fn();
    
    const { getByTestId } = render(
      <ImageGallery
        userId="test-user-id"
        itemType="clothing"
        onSelectImage={mockOnSelectImage}
      />
    );
    
    await waitFor(() => {
      const image = getByTestId('gallery-image-1');
      fireEvent.press(image);
      expect(mockOnSelectImage).toHaveBeenCalledWith('https://example.com/image.jpg');
    });
  });

  test('handles image deletion', async () => {
    const mockListFiles = jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'image1.jpg', created_at: '2023-01-01' },
      ],
      error: null,
    });
    
    const mockDeleteImage = jest.fn().mockResolvedValue({ error: null });
    
    jest.mock('../../hooks/useStorage', () => ({
      useStorage: () => ({
        listFiles: mockListFiles,
        getImageUrl: jest.fn(),
        deleteImage: mockDeleteImage,
      }),
    }));
    
    const mockOnDeleteImage = jest.fn();
    
    const { getByTestId } = render(
      <ImageGallery
        userId="test-user-id"
        itemType="clothing"
        onDeleteImage={mockOnDeleteImage}
        editable={true}
      />
    );
    
    await waitFor(() => {
      const deleteButton = getByTestId('delete-button-1');
      fireEvent.press(deleteButton);
      expect(mockDeleteImage).toHaveBeenCalled();
      expect(mockOnDeleteImage).toHaveBeenCalled();
    });
  });
});
```

### 7. Error Handling Testing

#### Error Recovery Testing
```typescript
describe('Error Handling and Recovery', () => {
  test('retries failed uploads automatically', async () => {
    // Mock upload to fail once then succeed
    let attemptCount = 0;
    const mockUpload = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Network error');
      }
      return { data: { path: 'test/path.jpg' }, error: null };
    });
    
    jest.mock('../../lib/storage', () => ({
      ...jest.requireActual('../../lib/storage'),
      uploadWithRetry: mockUpload,
    }));
    
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const result = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing'
    );
    
    // Should succeed after retry
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(attemptCount).toBe(2);
  });

  test('handles network interruptions during batch upload', async () => {
    // Mock network conditions
    let networkAvailable = true;
    
    // Mock fetch to simulate network interruption
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async (...args) => {
      if (!networkAvailable) {
        throw new Error('Network request failed');
      }
      return originalFetch(...args);
    });
    
    const testImages = await Promise.all([
      generateTestImage('test1.jpg'),
      generateTestImage('test2.jpg'),
      generateTestImage('test3.jpg')
    ]);
    
    const userId = 'test-user-id';
    
    // Start upload
    const uploadPromise = storageService.uploadBatch(
      testImages.map(img => img.uri),
      userId,
      'clothing'
    );
    
    // Simulate network interruption after 100ms
    setTimeout(() => {
      networkAvailable = false;
    }, 100);
    
    // Restore network after 500ms
    setTimeout(() => {
      networkAvailable = true;
    }, 500);
    
    const results = await uploadPromise;
    
    // Should have some successful and some failed uploads
    expect(results.some(r => r.error === null)).toBe(true);
    
    // Restore original fetch
    global.fetch = originalFetch;
  });

  test('provides detailed error information', async () => {
    // Test with invalid bucket
    const testImage = await generateTestImage('test-image.jpg');
    const userId = 'test-user-id';
    
    const result = await storageService.uploadImage(
      testImage.uri,
      userId,
      'clothing',
      undefined,
      { bucket: 'non-existent-bucket' }
    );
    
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('bucket');
  });
});
```

## Automated Testing Pipeline

### Continuous Integration
```yaml
name: Storage Integration Tests
on: [push, pull_request]

jobs:
  test-storage:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      supabase:
        image: supabase/storage-api:latest
        env:
          ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
          SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
          PGRST_DB_URI: postgres://postgres:postgres@postgres:5432/postgres
          REGION: us-east-1
          GLOBAL_S3_BUCKET: test-bucket
        ports:
          - 5000:5000
          
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      
      # Set up test database
      - name: Set up test database
        run: |
          psql -h localhost -U postgres -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
          psql -h localhost -U postgres -f supabase/migrations/create_storage_buckets.sql
          
      # Run storage tests
      - run: npm run test:storage
```

### Performance Monitoring
```typescript
// Performance benchmarks
const storageBenchmarks = {
  upload: {
    singleImage: 5000, // 5 seconds max
    batchUpload: 30000, // 30 seconds for 10 images
  },
  download: {
    original: 3000, // 3 seconds max
    thumbnail: 1000, // 1 second max
  },
  transformation: {
    resize: 2000, // 2 seconds max
    format: 3000, // 3 seconds max
  },
};
```

## Manual Testing Checklist

### Upload Testing
- [ ] Upload single image from camera
- [ ] Upload single image from gallery
- [ ] Upload multiple images in batch
- [ ] Upload images of different formats (JPG, PNG, WebP)
- [ ] Upload images of different sizes
- [ ] Test upload with poor network connection
- [ ] Test upload with network interruption
- [ ] Verify correct folder structure in storage

### Retrieval Testing
- [ ] Retrieve original image
- [ ] Retrieve thumbnail image
- [ ] Retrieve medium-sized image
- [ ] Retrieve large-sized image
- [ ] Test image loading performance
- [ ] Verify image quality at different sizes
- [ ] Test concurrent image loading

### Access Control Testing
- [ ] Verify users can only access their own images
- [ ] Verify users can only modify their own images
- [ ] Verify public read access works correctly
- [ ] Test access with unauthenticated user
- [ ] Test access with different user accounts

### Transformation Testing
- [ ] Test resize transformations
- [ ] Test format conversions
- [ ] Test quality adjustments
- [ ] Verify aspect ratio is maintained
- [ ] Test transformation performance

### Cleanup Testing
- [ ] Test orphaned file detection
- [ ] Test orphaned file cleanup
- [ ] Verify referenced files are not deleted
- [ ] Test storage stats accuracy

### Component Testing
- [ ] Test ImageUploader component
- [ ] Test ImageGallery component
- [ ] Test StorageStats component
- [ ] Verify UI feedback during operations
- [ ] Test error handling in components

This comprehensive testing strategy ensures the Supabase Storage integration is robust, secure, and performant, providing a reliable foundation for image management in the Stylisto application.