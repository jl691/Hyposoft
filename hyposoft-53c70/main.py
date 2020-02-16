import webapp2
from google.appengine.api import mail

class MainHandler(webapp2.RequestHandler):
	def get(self):
		self.response.write('Hello world!')

class AddUserHandler(webapp2.RequestHandler):
	def get(self):
		claimCode = self.request.get('claimCode')
		email = self.request.get('email')


		mail.send_mail(sender="HypoSoft Team <noreply@hyposoft-53c70.appspotmail.com>",
			to=email,
			subject="You've been added to HypoSoft",
			body="""Hello!

You've just been added to HypoSoft. Please click here to set up your account. If this was unexpected, you may safely disregard this email, or click here to let us know that something's wrong.

Best,
The HypoSoft Team""",
			html="""Hello!
<br><br>
Your HypoSoft administrator has just added you to the system. Please <a href="https://hyposoft.us/signup/%s">click here</a> to set up your account. If this was unexpected, you may safely disregard this email, or <a href="https://hyposoft.us/badsignup/%s">click here</a> to let us know that something's wrong.
<br><br>
Best,<br>
The HypoSoft Team""" % (claimCode,claimCode))
		self.response.write('Sent.')

class ForgotPasswordHandler(webapp2.RequestHandler):
	def get(self):
		secret = self.request.get('secret')
		email = self.request.get('email')

		mail.send_mail(sender="HypoSoft Team <noreply@hyposoft-53c70.appspotmail.com>",
			to=email,
			subject="Password recovery",
			body="""Hello!

You've requested a password reset for your HypoSoft account. Please click here to reset your password. If you did not request a password reset, you can safely ignore this email.

Best,
The HypoSoft Team""",
			html="""Hello!
<br><br>
You've requested a password reset for your HypoSoft account. Please <a href="https://hyposoft.us/resetpassword/%s">click here</a> to reset your password. If you did not request a password reset, you can safely ignore this email.
<br><br>
Best,<br>
The HypoSoft Team""" % (secret))
		self.response.write('Sent.')

app = webapp2.WSGIApplication([
	('/', MainHandler),
	('/addUser', AddUserHandler),
	('/forgotPassword', ForgotPasswordHandler)
], debug=True)