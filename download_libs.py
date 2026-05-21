import os
import urllib.request

def download_file(url, filepath):
    print(f"Downloading {url} to {filepath}...")
    try:
        # Define standard headers to prevent block by CDN
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        print(f"  Successfully downloaded to {filepath}")
    except Exception as e:
        print(f"  FAILED to download {url}: {e}")

def main():
    # Create lib directory
    lib_dir = "lib"
    if not os.path.exists(lib_dir):
        os.makedirs(lib_dir)
        print(f"Created directory: {lib_dir}")

    # List of assets to download
    assets = [
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
            "filename": "leaflet.min.css"
        },
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
            "filename": "leaflet.js"
        },
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.css",
            "filename": "MarkerCluster.css"
        },
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.Default.css",
            "filename": "MarkerCluster.Default.css"
        },
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/leaflet.markercluster.js",
            "filename": "leaflet.markercluster.js"
        },
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js",
            "filename": "leaflet-heat.js"
        },
        {
            "url": "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
            "filename": "chart.umd.min.js"
        },
        {
            "url": "https://unpkg.com/lucide@0.379.0/dist/umd/lucide.min.js",
            "filename": "lucide.min.js"
        }
    ]

    for asset in assets:
        dest_path = os.path.join(lib_dir, asset["filename"])
        download_file(asset["url"], dest_path)

if __name__ == "__main__":
    main()
