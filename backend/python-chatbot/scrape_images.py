import os
import re
import requests
from urllib.parse import urljoin

def scrape_images():
    url = "https://nayepankh.com/"
    print(f"Fetching HTML from {url}...")
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        r.raise_for_status()
        html = r.text
    except Exception as e:
        print(f"Failed to fetch website HTML: {e}")
        return

    # Find image sources using regex
    img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    # Also find CSS background images if any
    bg_srcs = re.findall(r'url\(["\']?([^"\')]+)["\']?\)', html)
    # Also find meta OG images
    og_srcs = re.findall(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
    og_srcs_2 = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)

    raw_urls = set(img_srcs + bg_srcs + og_srcs + og_srcs_2)
    
    # Target directory in the React frontend public assets
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/public/assets/images"))
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"Found {len(raw_urls)} candidate image URLs. Downloading to {target_dir}...")
    
    downloaded_count = 0
    for i, img_url in enumerate(raw_urls):
        # Skip small icons or tracking pixels
        if "data:" in img_url or img_url.endswith(".svg") or "analytics" in img_url:
            continue
            
        full_url = urljoin(url, img_url)
        # Handle protocol relative URLs
        if img_url.startswith("//"):
            full_url = "https:" + img_url
            
        try:
            print(f"Downloading [{i}]: {full_url} ...")
            response = requests.get(full_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            response.raise_for_status()
            
            # Determine file extension
            ext = os.path.splitext(img_url.split('?')[0])[1]
            if not ext or len(ext) > 5:
                # Guess from content type
                content_type = response.headers.get('content-type', '')
                if 'jpeg' in content_type or 'jpg' in content_type:
                    ext = '.jpg'
                elif 'png' in content_type:
                    ext = '.png'
                elif 'webp' in content_type:
                    ext = '.webp'
                else:
                    ext = '.png'
            
            filename = f"ngo_image_{i}{ext}"
            filepath = os.path.join(target_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"Saved to {filename}")
            downloaded_count += 1
        except Exception as e:
            print(f"Error downloading {full_url}: {e}")

    print(f"\nDownload finished! Successfully downloaded {downloaded_count} images.")

if __name__ == "__main__":
    scrape_images()
