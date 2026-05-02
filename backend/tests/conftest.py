import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / '.env')

FRONTEND_ENV = Path(__file__).parent.parent.parent / 'frontend' / '.env'
if FRONTEND_ENV.exists():
    load_dotenv(FRONTEND_ENV)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope='session')
def base_url():
    assert BASE_URL, 'EXPO_PUBLIC_BACKEND_URL not set'
    return BASE_URL


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s
