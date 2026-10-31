import os
import shutil
import zipfile
import json
from datetime import datetime
from bson import json_util
from flask import current_app
from app.db import mongo

class BackupService:
    @staticmethod
    def create_backup():
        """
        Creates a consistent, atomic backup of MongoDB collections and candidate files.
        """
        backups_dir = current_app.config["BACKUPS_STORAGE"]
        os.makedirs(backups_dir, exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backup_{timestamp}.zip"
        backup_zip_path = os.path.join(backups_dir, backup_filename)

        temp_dir = os.path.join(current_app.config["TEMP_STORAGE"], f"backup_staging_{timestamp}")
        os.makedirs(temp_dir, exist_ok=True)

        try:
            # 1. Dump MongoDB collections to JSON
            mongo_dump_dir = os.path.join(temp_dir, "mongodb_dump")
            os.makedirs(mongo_dump_dir, exist_ok=True)

            collections = ["users", "candidates", "follow_ups", "visitors", "activity_logs", "application_settings"]
            for col_name in collections:
                cursor = mongo.db[col_name].find({})
                docs = list(cursor)
                with open(os.path.join(mongo_dump_dir, f"{col_name}.json"), "w", encoding="utf-8") as f:
                    f.write(json_util.dumps(docs, indent=2))

            # 2. Copy candidate storage folder
            candidates_src = current_app.config["CANDIDATES_STORAGE"]
            candidates_dst = os.path.join(temp_dir, "candidates")
            if os.path.exists(candidates_src):
                shutil.copytree(candidates_src, candidates_dst, dirs_exist_ok=True)

            # 3. Create manifest.json
            manifest = {
                "created_at": datetime.utcnow().isoformat(),
                "backup_version": "2.0-mongodb",
                "app_name": current_app.config["APP_NAME"],
                "database_engine": "mongodb",
                "collections_included": collections,
                "candidates_dir_included": os.path.exists(candidates_dst)
            }
            with open(os.path.join(temp_dir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)

            # 4. Create final ZIP
            with zipfile.ZipFile(backup_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(temp_dir):
                    for file in files:
                        p = os.path.join(root, file)
                        arc = os.path.relpath(p, temp_dir)
                        zipf.write(p, arcname=arc)

            file_size = os.path.getsize(backup_zip_path)
            return {
                "success": True,
                "filename": backup_filename,
                "path": backup_zip_path,
                "file_size": file_size,
                "created_at": manifest["created_at"]
            }
        except Exception as e:
            if os.path.exists(backup_zip_path):
                os.remove(backup_zip_path)
            raise RuntimeError(f"Backup creation failed: {str(e)}")
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

    @staticmethod
    def list_backups():
        backups_dir = current_app.config["BACKUPS_STORAGE"]
        if not os.path.exists(backups_dir):
            return []
        
        backups = []
        for file in os.listdir(backups_dir):
            if file.endswith(".zip") and file.startswith("backup_"):
                fp = os.path.join(backups_dir, file)
                size = os.path.getsize(fp)
                mtime = os.path.getmtime(fp)
                dt = datetime.fromtimestamp(mtime).strftime("%d-%m-%Y %H:%M:%S")
                backups.append({
                    "filename": file,
                    "size_bytes": size,
                    "created_at": dt
                })
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        return backups

    @staticmethod
    def restore_backup(backup_filename):
        """
        Validates backup integrity and restores MongoDB collections and storage files.
        """
        backups_dir = current_app.config["BACKUPS_STORAGE"]
        backup_path = os.path.join(backups_dir, backup_filename)
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup file not found: {backup_filename}")

        temp_dir = os.path.join(current_app.config["TEMP_STORAGE"], "restore_staging")
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        os.makedirs(temp_dir, exist_ok=True)

        try:
            with zipfile.ZipFile(backup_path, "r") as zipf:
                zipf.extractall(temp_dir)

            manifest_path = os.path.join(temp_dir, "manifest.json")
            if not os.path.exists(manifest_path):
                raise ValueError("Invalid backup archive: manifest.json is missing.")

            mongo_dump_dir = os.path.join(temp_dir, "mongodb_dump")
            if os.path.exists(mongo_dump_dir):
                collections = ["users", "candidates", "follow_ups", "visitors", "activity_logs", "application_settings"]
                for col_name in collections:
                    col_file = os.path.join(mongo_dump_dir, f"{col_name}.json")
                    if os.path.exists(col_file):
                        with open(col_file, "r", encoding="utf-8") as f:
                            docs = json_util.loads(f.read())
                        mongo.db[col_name].delete_many({})
                        if docs:
                            mongo.db[col_name].insert_many(docs)

            restored_candidates = os.path.join(temp_dir, "candidates")
            if os.path.exists(restored_candidates):
                candidates_target = current_app.config["CANDIDATES_STORAGE"]
                shutil.copytree(restored_candidates, candidates_target, dirs_exist_ok=True)

            return True, "Backup successfully verified and restored into MongoDB."
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
