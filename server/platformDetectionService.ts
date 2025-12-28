// Platform detection service for mix submissions
// Integrates with existing submission workflow to handle reference-only platforms

import { detectMusicPlatform, extractTrackId, MusicPlatform } from '../shared/platformDetection';
import type { MixSubmission } from '../shared/schema';

export interface PlatformEnrichmentResult {
  platform: MusicPlatform;
  playback_mode: 'embed' | 'file' | 'stream';
  is_radio_ingestable: boolean;
  requires_alternative: boolean;
  rights_status: 'unverified' | 'ok_to_stream';
  metadata?: {
    trackId?: string;
    warning?: string;
    adminMessage?: string;
  };
}

/**
 * Enrich mix submission with platform detection data
 */
export function enrichMixSubmissionWithPlatform(url: string): PlatformEnrichmentResult {
  const platformInfo = detectMusicPlatform(url);
  const { platform, trackId } = extractTrackId(url);
  
  const result: PlatformEnrichmentResult = {
    platform: platformInfo.platform,
    playback_mode: platformInfo.playbackMode,
    is_radio_ingestable: platformInfo.isRadioIngestable,
    requires_alternative: platformInfo.requiresAlternative,
    rights_status: 'unverified',
    metadata: {}
  };

  // Add platform-specific metadata and warnings
  switch (platformInfo.platform) {
    case 'spotify':
      result.metadata = {
        trackId: trackId || undefined,
        warning: 'This is a Spotify link - it can only be embedded on the website.',
        adminMessage: 'To air on radio: Upload MP3/ZIP or provide downloadable alternative source.'
      };
      break;
      
    case 'apple':
      result.metadata = {
        trackId: trackId || undefined,
        warning: 'This is an Apple Music link - it can only be embedded on the website.',
        adminMessage: 'To air on radio: Upload MP3/ZIP or provide downloadable alternative source.'
      };
      break;
      
    case 'youtube':
      result.metadata = {
        trackId: trackId || undefined,
        warning: 'This is a YouTube link - it can only be embedded on the website.',
        adminMessage: 'To air on radio: Upload MP3/ZIP or provide downloadable alternative source.'
      };
      break;
      
    case 'soundcloud':
      result.metadata = {
        adminMessage: 'SoundCloud submission - can be processed for radio if downloadable.'
      };
      break;
      
    case 'mixcloud':
      result.metadata = {
        adminMessage: 'Mixcloud submission - can be processed for radio if downloadable.'
      };
      break;
      
    case 'audio':
      result.metadata = {
        adminMessage: 'Audio.com submission - can be processed for radio.'
      };
      break;
      
    case 'upload':
      result.metadata = {
        adminMessage: 'Direct audio file - ready for radio.'
      };
      result.rights_status = 'ok_to_stream';
      break;
      
    default:
      result.metadata = {
        warning: 'Unknown platform - manual review required.',
        adminMessage: 'Platform not recognized - verify URL and platform support.'
      };
      break;
  }

  return result;
}

/**
 * Check if mix can be pushed to AzuraCast based on platform and alternative sources
 */
export function canPushToAzuraCast(mix: Partial<MixSubmission>): {
  canPush: boolean;
  reason: string;
} {
  // Direct audio files are always OK
  if (mix.platform === 'upload' && mix.rights_status === 'ok_to_stream') {
    return { canPush: true, reason: 'Direct audio file with verified rights' };
  }
  
  // Reference-only platforms need alternatives
  if (!mix.is_radio_ingestable) {
    if (mix.radio_file_path && mix.rights_status === 'ok_to_stream') {
      return { canPush: true, reason: 'Alternative radio file uploaded' };
    }
    if (mix.radio_alt_url) {
      return { canPush: true, reason: 'Alternative source URL provided (needs processing)' };
    }
    return { 
      canPush: false, 
      reason: `${mix.platform} requires alternative source - upload MP3/ZIP or provide downloadable URL` 
    };
  }
  
  // Radio-ingestable platforms (SoundCloud, Mixcloud, etc.)
  if (mix.is_radio_ingestable) {
    return { canPush: true, reason: `${mix.platform} is radio-ingestable` };
  }
  
  return { canPush: false, reason: 'Platform compatibility check failed' };
}

/**
 * Generate submission warning messages for frontend display
 */
export function getSubmissionWarning(platform: MusicPlatform): {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  showAlternativeFields: boolean;
} {
  switch (platform) {
    case 'spotify':
      return {
        type: 'warning',
        title: 'Spotify Link Detected',
        message: 'This link will embed on the website only. To air on Enamorado Radio, upload a radio version (MP3/ZIP) or provide an alternate downloadable link.',
        showAlternativeFields: true
      };
      
    case 'apple':
      return {
        type: 'warning',
        title: 'Apple Music Link Detected',
        message: 'This link will embed on the website only. To air on Enamorado Radio, upload a radio version (MP3/ZIP) or provide an alternate downloadable link.',
        showAlternativeFields: true
      };
      
    case 'youtube':
      return {
        type: 'warning',
        title: 'YouTube Link Detected',
        message: 'This link will embed on the website only. To air on Enamorado Radio, upload a radio version (MP3/ZIP) or provide an alternate downloadable link.',
        showAlternativeFields: true
      };
      
    case 'soundcloud':
      return {
        type: 'info',
        title: 'SoundCloud Link Detected',
        message: 'This submission can be featured on the website and processed for radio if downloadable.',
        showAlternativeFields: false
      };
      
    case 'mixcloud':
      return {
        type: 'info',
        title: 'Mixcloud Link Detected',
        message: 'This submission can be featured on the website and processed for radio if downloadable.',
        showAlternativeFields: false
      };
      
    default:
      return {
        type: 'info',
        title: 'Platform Detected',
        message: 'Platform recognized - submission will be reviewed.',
        showAlternativeFields: false
      };
  }
}

/**
 * Update mix submission with platform-specific routing flags
 */
export function setPlatformRoutingDefaults(enrichmentData: PlatformEnrichmentResult): {
  featureOnSite: boolean;
  pushToAzura: boolean;
} {
  // Reference-only platforms: feature on site, don't push to AzuraCast by default
  if (!enrichmentData.is_radio_ingestable) {
    return {
      featureOnSite: true,
      pushToAzura: false
    };
  }
  
  // Radio-ingestable platforms: feature on site and push to AzuraCast
  return {
    featureOnSite: true,
    pushToAzura: true
  };
}

/**
 * Log platform detection for debugging
 */
export function logPlatformDetection(url: string, enrichmentData: PlatformEnrichmentResult): void {
  console.log(`[Platform Detection] URL: ${url}`);
  console.log(`[Platform Detection] Platform: ${enrichmentData.platform}`);
  console.log(`[Platform Detection] Radio Ingestable: ${enrichmentData.is_radio_ingestable}`);
  console.log(`[Platform Detection] Requires Alternative: ${enrichmentData.requires_alternative}`);
  if (enrichmentData.metadata?.warning) {
    console.log(`[Platform Detection] Warning: ${enrichmentData.metadata.warning}`);
  }
  if (enrichmentData.metadata?.adminMessage) {
    console.log(`[Platform Detection] Admin: ${enrichmentData.metadata.adminMessage}`);
  }
}