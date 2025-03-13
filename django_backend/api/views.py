from django.shortcuts import render

# Create your views here.
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db import connection

@api_view(['GET'])
def home(request): 
  """Show DB Time"""
  with connection.cursor() as cursor: 
    cursor.execute("SELECT NOW()")
    row = cursor.fetchone()
  return Response({
    'message': 'Hello from Django API',
    'dbTime': row[0] if row else None
  })