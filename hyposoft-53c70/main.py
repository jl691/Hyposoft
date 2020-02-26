import webapp2, urllib, csv, json, io
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
		self.response.headers['Access-Control-Allow-Origin'] = '*'
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
		self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.write('Sent.')

class PowerOnHandler(webapp2.RequestHandler):
	def get(self):
		urllib.urlopen('http://vcm-13238.vm.duke.edu:3011/poweron/'+self.request.get('pdu')+'/'+self.request.get('port')).read()
		self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.write('Done.')

class PowerOffHandler(webapp2.RequestHandler):
	def get(self):
		urllib.urlopen('http://vcm-13238.vm.duke.edu:3011/poweroff/'+self.request.get('pdu')+'/'+self.request.get('port')).read()
		self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.write('Done.')

class GetPduStatusesHandler(webapp2.RequestHandler):
	def get(self):
		self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.write(urllib.urlopen('http://vcm-13238.vm.duke.edu:3011/get/'+self.request.get('pdu')).read())

class ParseCSVHandler(webapp2.RequestHandler):
	def post(self):
		fileContents = unicode(self.request.POST.get('file').file.read())
		self.response.headers['Access-Control-Allow-Origin'] = '*'
		self.response.headers['Access-Control-Allow-Methods'] = '*'
		self.response.headers['Access-Control-Allow-Headers'] = '*'

		reader = csv.DictReader(io.StringIO(fileContents))
		response = []
		for row in reader:
			response.append(row)
		self.response.write(json.dumps(response))
		

app = webapp2.WSGIApplication([
	('/', MainHandler),
	('/addUser', AddUserHandler),
	('/forgotPassword', ForgotPasswordHandler),
	('/poweron', PowerOnHandler),
	('/poweroff', PowerOffHandler),
	('/getPduStatuses', GetPduStatusesHandler),
	('/parseCSV', ParseCSVHandler)
], debug=True)

# SDK LOCATION: /Applications/Google App Engine.app/Contents/Resources/GoogleAppEngine-default.bundle/Contents/Resources/google_appengine