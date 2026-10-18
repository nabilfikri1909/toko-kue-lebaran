import os
import shutil
import tarfile
import zipfile

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "deploy-package")
TAR_PATH = os.path.join(BASE_DIR, "deploy-standalone.tar.gz")
ZIP_PATH = os.path.join(BASE_DIR, "deploy-standalone.zip")

print("[*] Menyiapkan bundle standalone untuk VPS Linux...")

if os.path.exists(TEMP_DIR):
    shutil.rmtree(TEMP_DIR)
os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Copy standalone runtime
standalone_dir = os.path.join(BASE_DIR, ".next", "standalone")
print(f"[*] Menyalin standalone runtime dari: {standalone_dir}")
for item in os.listdir(standalone_dir):
    s = os.path.join(standalone_dir, item)
    d = os.path.join(TEMP_DIR, item)
    if os.path.isdir(s):
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        shutil.copy2(s, d)

# 2. Copy static files ke .next/static
static_src = os.path.join(BASE_DIR, ".next", "static")
static_dst = os.path.join(TEMP_DIR, ".next", "static")
print(f"[*] Menyalin static files ke .next/static...")
shutil.copytree(static_src, static_dst, dirs_exist_ok=True)

# 3. Copy public folder
public_src = os.path.join(BASE_DIR, "public")
public_dst = os.path.join(TEMP_DIR, "public")
print(f"[*] Menyalin public folder...")
shutil.copytree(public_src, public_dst, dirs_exist_ok=True)

# 4. Copy .env.local
env_src = os.path.join(BASE_DIR, ".env.local")
if os.path.exists(env_src):
    print(f"[*] Menyalin .env.local...")
    shutil.copy2(env_src, os.path.join(TEMP_DIR, ".env.local"))

# 5. Copy ecosystem.config.js
pm2_src = os.path.join(BASE_DIR, "ecosystem.config.js")
if os.path.exists(pm2_src):
    shutil.copy2(pm2_src, os.path.join(TEMP_DIR, "ecosystem.config.js"))

# 6. Buat TAR.GZ (Native Linux format, paling aman & direkomendasikan)
print(f"[*] Membuat {TAR_PATH} (format tar.gz Linux)...")
with tarfile.open(TAR_PATH, "w:gz") as tar:
    for root, dirs, files in os.walk(TEMP_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, TEMP_DIR).replace("\\", "/")
            tar.add(full_path, arcname=rel_path)

# 7. Buat ZIP dengan POSIX Forward Slashes
print(f"[*] Membuat {ZIP_PATH} (format ZIP dengan POSIX forward slashes)...")
with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(TEMP_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, TEMP_DIR).replace("\\", "/")
            zipf.write(full_path, arcname=rel_path)

# Bersihkan temp directory
shutil.rmtree(TEMP_DIR)

tar_size = os.path.getsize(TAR_PATH) / (1024 * 1024)
zip_size = os.path.getsize(ZIP_PATH) / (1024 * 1024)

print(f"[+] SELESAI!")
print(f"    - TAR.GZ : {tar_size:.2f} MB -> {TAR_PATH}")
print(f"    - ZIP    : {zip_size:.2f} MB -> {ZIP_PATH}")
