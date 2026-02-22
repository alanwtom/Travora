from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from travora_backend.supabase_client import get_supabase


@api_view(['GET'])
def videos_list(request):
    """Proxy endpoint: fetch videos from Supabase and return JSON."""
    supabase = get_supabase()
    try:
        res = supabase.from_('videos').select('*').order('created_at', desc=True).limit(50).execute()
        if res.error:
            return Response({'error': str(res.error)}, status=500)
        return Response(res.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
