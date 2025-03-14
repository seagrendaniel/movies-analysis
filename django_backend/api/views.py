from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from datetime import datetime

@api_view(['GET'])
def theaters(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, company, location FROM theater ORDER BY id")
        rows = cursor.fetchall()
    data = [{"id": row[0], "company": row[1], "location": row[2]} for row in rows]
    return Response(data)

@api_view(['GET'])
def movies(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, title FROM movie ORDER BY id")
        rows = cursor.fetchall()
    data = [{"id": row[0], "title": row[1]} for row in rows]
    return Response(data)

@api_view(['GET'])
def best_theater(request):
  FIXED_TICKET_PRICE = 10.00  # Can adjust as needed

  sale_date = request.query_params.get('sale_date')
  if not sale_date: 
    return Response({"error": "Please provide a sale_date parameter (YYYY-MM-DD)."}, status=400)
  
  # Validate sale_date format
  try:
    datetime.strptime(sale_date, '%Y-%m-%d')
  except ValueError:
    return Response({"error": "Invalid date format. Date should be of type YYYY-MM-DD"}, status=400)
    
  query = """
      SELECT t.id AS theater_id, t.company AS company_name, t.location, COUNT(s.id) AS total_sales, COUNT(s.id) * %s AS total_revenue
      FROM tickets s
      JOIN theater t ON s.theaterId = t.id
      WHERE s.sale_date = %s
      GROUP BY t.id, t.company, t.location
      ORDER BY total_sales DESC
      LIMIT 1;
  """

  with connection.cursor() as cursor:
      cursor.execute(query, [FIXED_TICKET_PRICE, sale_date])
      row = cursor.fetchone()

  if row:
      theater = {
          "theater_id": row[0],
          "company_name": row[1],
          "location": row[2],
          "total_sales": row[3],
          "total_revenue": row[4]
      }
      return Response(theater)
  else:
      return Response({"message": "No data found for the given date."}, status=404)