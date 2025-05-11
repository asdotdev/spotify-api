export const simplifyTopTracks = (tracks) => {
    return tracks.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
        album_image: track.album.images[0]?.url,
    }));
};

export const simplifyNowPlaying = (data) => {
    if (!data || !data.item) return null;

    const item = data.item;

    return {
        isPlaying: data.is_playing,
        title: item.name,
        artist: item.artists.map((a) => a.name).join(", "),
        album: item.album.name,
        albumImageUrl: item.album.images[0]?.url,
        trackUrl: item.external_urls.spotify,
    };
};

export const simplifyFollowedArtists = (artists) => {
    return artists.map((artist) => ({
        name: artist.name,
        genres: artist.genres,
        followers: artist.followers.total,
        image: artist.images[0]?.url,
        url: artist.external_urls.spotify,
    }));
};
