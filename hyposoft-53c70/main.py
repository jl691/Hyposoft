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

Have fun!
The HypoSoft Team""",
			html="""Hello!
<br><br>
Your HypoSoft administrator has just added you to the system. Please <a href="http://localhost:3000/claim/%s">click here</a> to set up your account. If this was unexpected, you may safely disregard this email, or <a href="http://localhost:3000/unclaim/%s">click here</a> to let us know that something's wrong.
<br><br>
Have fun!<br>
The HypoSoft Team""" % (claimCode, claimCode))
		self.response.write('Sent.')

app = webapp2.WSGIApplication([
	('/', MainHandler),
	('/addUser', AddUserHandler)
], debug=True)