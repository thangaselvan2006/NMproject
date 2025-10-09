1️⃣ Setup in Postman

Open Postman.

Create a new Collection:

Name: Student Grading System.

This keeps all requests organized.

Create Environment variables (optional but recommended):

baseUrl → http://localhost:5000

token → leave blank (we’ll populate after login)

studentId → leave blank (will be set after adding a student)

2️⃣ Register Admin User

Method: POST

URL: {{baseUrl}}/api/auth/register

Body (JSON):

{
  "username": "admin1",
  "password": "AdminPass123",
  "role": "admin"
}


Send request → Response should include id, username, role.

3️⃣ Login Admin

Method: POST

URL: {{baseUrl}}/api/auth/login

Body (JSON):

{
  "username": "admin1",
  "password": "AdminPass123"
}


Send request → Response includes token.

Copy the token value into Environment variable token.

4️⃣ Add a Student

Method: POST

URL: {{baseUrl}}/api/students

Headers:

Authorization: Bearer {{token}}

Content-Type: application/json

Body (JSON):

{
  "firstName": "Ravi",
  "lastName": "Kumar",
  "rollNumber": "R10",
  "className": "10A",
  "dob": "2009-03-01"
}


Send request → Response includes _id.

Copy _id into Environment variable studentId for future requests.

5️⃣ Add a Grade

Method: POST

URL: {{baseUrl}}/api/grades

Headers:

Authorization: Bearer {{token}}

Content-Type: application/json

Body (JSON):

{
  "studentId": "{{studentId}}",
  "subject": "Math",
  "marks": 86,
  "totalMarks": 100,
  "gradeType": "exam"
}


Send → Response shows the grade record.

6️⃣ Retrieve Grades for a Student

Method: GET

URL: {{baseUrl}}/api/grades/student/{{studentId}}

Headers:

Authorization: Bearer {{token}}

Response shows all grades for the student.

7️⃣ Retrieve Grades for a Class

Method: GET

URL: {{baseUrl}}/api/grades/class/10A

Headers:

Authorization: Bearer {{token}}

Response shows grades for all students in class 10A.

8️⃣ Export Report Card (PDF)

Method: GET

URL: {{baseUrl}}/api/export/reportcard/{{studentId}}

Headers:

Authorization: Bearer {{token}}

Important:

In Postman, click Send and Download → PDF will download.

Shows all subjects, marks, total, and percentage.