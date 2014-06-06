require.config({
  baseUrl: '/js',
  paths: {
    'l10n': '../shared/js/l10n',
    'asyncStorage': '../shared/js/async_storage',
    'getVideoRotation': '../shared/js/media/get_video_rotation',
    'performance-testing-helper': '../shared/js/performance_testing_helper',
    'jpegMetaDataParser': '../shared/js/media/jpeg_metadata_parser',
    'format': '../shared/js/format',
    'GestureDetector': '../shared/js/gesture_detector',
    'VideoPlayer': '../shared/js/media/video_player',
    'MediaFrame': '../shared/js/media/media_frame',
    'BlobView': '../shared/js/blobview',
    'CustomDialog': '../shared/js/custom_dialog',
    'FontSizeUtils': '../shared/js/font_size_utils',
    'debug': 'vendor/debug'
  },
  shim: {
    'format': {
      exports: 'Format'
    },
    'getVideoRotation': {
      deps: ['BlobView'],
      exports: 'getVideoRotation'
    },
    'MediaFrame': {
      deps: ['format', 'VideoPlayer'],
      exports: 'MediaFrame'
    },
    'BlobView': {
      exports: 'BlobView'
    },
    'asyncStorage': {
      exports: 'asyncStorage'
    },
    'performance-testing-helper': {
      exports: 'PerformanceTestingHelper'
    },
    'jpegMetaDataParser': {
      deps: ['BlobView'],
      exports: 'parseJPEGMetadata'
    },
    'GestureDetector': {
      exports: 'GestureDetector'
    },
    'CustomDialog': {
      exports: 'CustomDialog'
    },
    'FontSizeUtils': {
      exports: 'FontSizeUtils'
    }
  }
});
