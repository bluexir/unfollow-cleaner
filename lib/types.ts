export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
}

export interface NonFollower extends FarcasterUser {
  selected?: boolean;
}

export interface UnfollowResponse {
  success: boolean;
  message?: string;
  failed?: number[];
}

export interface CheckFollowResponse {
  isFollowing: boolean;
}
