import os
from pathlib import Path
from dotenv import load_dotenv

from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

_client = None

def get_supabase():
    global _client
    if _client is None:
        url = os.environ.get('SUPABASE_URL')
        key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_ANON_KEY')
        if not url or not key:
            raise RuntimeError('SUPABASE_URL or SUPABASE_KEY not set in .env')
        _client = create_client(url, key)
    return _client
