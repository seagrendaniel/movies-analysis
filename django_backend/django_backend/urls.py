from django.contrib import admin
from django.urls import path
from api.views import best_theater, theaters, movies, company_sales_performance

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/best_theater/', best_theater, name='best_theater'),
    path('api/theaters/', theaters, name='theaters'),
    path('api/movies/', movies, name='movies'),
    path('api/company_sales_performance', company_sales_performance, name='company_sales_performance')
]
