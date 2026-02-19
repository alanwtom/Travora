from django.urls import path
from . import views

urlpatterns = [
    path('videos/', views.videos_list, name='videos-list'),
]
