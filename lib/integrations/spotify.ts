export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string;
  spotifyUrl: string;
}

interface SpotifyEmbedAPI {
  createIframedEmbed: (
    uri: string,
    options: {
      width: string;
      height: string;
      theme: string;
    },
    element: HTMLElement | null
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyEmbedAPI) => void;
  }
}

let spotifyEmbedAPI: SpotifyEmbedAPI | null = null;

export function initSpotifyEmbed() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
    script.async = true;

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      spotifyEmbedAPI = IFrameAPI;
      resolve(IFrameAPI);
    };

    document.body.appendChild(script);
  });
}

export function createSpotifyEmbed(elementId: string, uri: string) {
  if (!spotifyEmbedAPI) {
    console.error('Spotify Embed API not initialized');
    return;
  }

  spotifyEmbedAPI.createIframedEmbed(
    uri,
    {
      width: '100%',
      height: '152',
      theme: 'dark',
    },
    document.getElementById(elementId)
  );
}

export async function getCurrentTrack(): Promise<SpotifyTrack | null> {
  try {
    // This would typically use the Spotify Web API, but since we're using embeds,
    // we'll return a mock track for now. In a real implementation, you'd need to
    // set up proper authentication and use the Spotify Web API.
    return {
      name: "Currently Playing",
      artist: "Various Artists",
      album: "Mixed",
      albumArt: "/spotify-placeholder.png",
      previewUrl: "",
      spotifyUrl: "https://open.spotify.com/user/tetraslam"
    };
  } catch (error) {
    console.error('Error fetching current track:', error);
    return null;
  }
} 