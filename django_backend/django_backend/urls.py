from django.contrib import admin
from django.urls import path
from api.views import best_theater

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/best_theater/', best_theater, name='best_theater')
]
