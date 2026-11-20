export function getDefaultFeaturedImage(): string {
  try {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('zw_default_featured_image');
      if (custom && custom.trim()) return custom.trim();
      const zw = localStorage.getItem('zwosmos_site_settings');
      if (zw) {
        const parsed = JSON.parse(zw);
        if (parsed.defaultFeaturedImageUrl && parsed.defaultFeaturedImageUrl.trim()) {
          return parsed.defaultFeaturedImageUrl.trim();
        }
      }
    }
  } catch {}
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop';
}
