# Process Simulation Platform

A web-based platform for chemical process simulation and green chemistry optimization. [Site link](https://process-simulation-platform-f772b7ee7e1a.herokuapp.com/)
## Features

- Interactive process simulation interface
- Green chemistry optimization tools
- User-friendly web interface
- Process flow diagram visualization

## Technologies Used

- Django (Backend)
- HTML/CSS (Frontend)
- Python
- Process Simulation Libraries

## Setup

1. Clone the repository:
```bash
git clone [[repository-url]](https://github.com/kamranayazheydarov/Process-Simulation-Platform.git)
cd "Process-Simulation-Platform"
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start development server:
```bash
python manage.py runserver
```

Visit `http://localhost:8000` to access the application.

## Project Structure

```
green chemistry hackhaton 2/
├── pages/
│   ├── static/
│   │   └── css/
│   └── templates/
├── manage.py
└── README.md
```


