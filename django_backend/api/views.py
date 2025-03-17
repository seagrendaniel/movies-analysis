from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from datetime import datetime

FIXED_TICKET_PRICE = 10.00  # Can adjust as needed

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
@ratelimit(key='ip', rate='60/m', block=True)
def best_theater(request):

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

  
@api_view(['GET'])
def company_sales_performance(request):
    company = request.query_params.get('company')
    if not company:
        return Response({"error": "Please provide a company parameter."}, status=400)
    
    query = """
      SELECT
        t.id AS "theaterId",
        t.company AS "company",
        t.location AS "location",
        json_agg(
          json_build_object(
            'date', to_char(tp.sale_date, 'YYYY-MM'),
            'ticketsSold', tp.ticketsSold,
            'revenue', tp.revenue
          ) ORDER BY tp.sale_date
        ) AS "sales"
      FROM theater t
      JOIN (
        SELECT 
          theaterId,
          sale_date,
          COUNT(*) AS ticketsSold,
          COUNT(*) * %s AS revenue
        FROM tickets
        WHERE sale_date BETWEEN current_date - interval '6 months' AND current_date
        GROUP BY theaterId, sale_date
      ) tp ON tp.theaterId = t.id
      WHERE t.company = %s
      GROUP BY t.id, t.company, t.location;
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [FIXED_TICKET_PRICE, company])
            rows = cursor.fetchall()
            if not rows:
                return Response({"message": "No sales data found for the given company."}, status=404)
            # Get column names from the cursor description to ensure key matching 
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in rows]
        return Response(results)
    except Exception as e:
        print("Error fetching sales data:", e)
        return Response({"error": "Internal server error."}, status=500)