from django.contrib import admin
from django.urls import path
from api.views import home

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', home)
]
