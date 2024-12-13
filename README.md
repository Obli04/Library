# Library Management System by Davide Scaccia

Required External Libraries:
   -- Frontend Dependencies --
1. React
   - https://reactjs.org/
2. React Router DOM
   - https://reactrouter.com/
3. React Modal
   - https://github.com/reactjs/react-modal
4. js-cooki
   - https://github.com/js-cookie/js-cookie
5. React Stars
   - https://www.npmjs.com/package/react-rating-stars-component

 -- Backend Dependencies -- 
(All requirements can be found in the library_management/requirements.txt file): pip install -r library_management/requirements.txt
1. Python 3.11.5
   - https://www.python.org/downloads/release/python-3115/
2. Django
   - https://www.djangoproject.com/
3. Django REST Framework
   - https://www.django-rest-framework.org/
4. Django CORS Headers
   - https://github.com/adamchainz/django-cors-headers

Building and Running the Project:
------------------------------

1. Frontend Setup:
   cd react-app/my-library-frontend
   npm install
   npm start

2. Backend Setup:
   cd library_management
   pip install -r requirements.txt
   python manage.py runserver

The application will be available at
- Frontend: http://127.0.0.1:3000
- Backend: http://127.0.0.1:8000