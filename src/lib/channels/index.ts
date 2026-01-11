/**
 * Alert Channels Module
 */

export {
  CHANNEL_CONFIGS,
  RESPONDER_PARTNERS,
  PUBLIC_DISPLAY_PARTNERS,
  CAMERA_IOT_PARTNERS,
  checkChannelEligibility,
  getEligibleChannels,
} from './alert-channels';

export type {
  ChannelId,
  ResponderType,
  PublicDisplayType,
  CameraIoTType,
  ChannelConfig,
  ResponderPartner,
  PublicDisplayPartner,
  CameraIoTPartner,
  ChannelEligibility,
} from './alert-channels';
