#
# Copyright 2020 XEBIALABS
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#

import com.xhaus.jyson.JysonCodec as Json
import urllib
from util import error
from xlrelease.HttpRequest import HttpRequest
from org.apache.http.client import ClientProtocolException

class MantisbtClient:

    def __init__(self, mantisbt_server):
        if mantisbt_server is None:
            error(u'No Server provided')
        self.content_type = 'application/json'
        self.encoding = 'utf-8'
        self.mantisbt_server = mantisbt_server
        if self.mantisbt_server['apiKey'] is None:
            error(u'No API Key provided')
        self.headers = {'Authorization': self.mantisbt_server['apiKey'] }

    def getIssue(self, issueId):
        if issueId == None or len(issueId)<1:
           error(u'IssueId can not be null')
        request = self._createRequest()
        url = '/api/rest/issues/' + issueId
        try:
            response = request.get(url, content=None, contentType=self.content_type, headers=self.headers)
            if response.status == 200:
                return self._returnIssue(response.response)
            else:
                error(u'Failed to get issue', response)
        except ClientProtocolException:
            raise Exception()

    def updateIssueStatus(self, issueId, newSatus, note, text):
        request = self._createRequest()
        newContent = {
            'status': {
                'name': newSatus
            }
        }
        newContent = self._serialize(newContent)
        url = '/api/rest/issues/' + issueId

        try:
            response = request.patch(url, newContent, contentType=self.content_type, headers=self.headers)
            if response.status == 200:
                print(u'Issue {0} updated'.format(issueId))
                if note:
                    self.createNote(text, issueId, [])
                return self._returnIssue(response.response)
            else:
                print(u'Error updating issue {0}: {1}'.format(issueId, response))
        except ClientProtocolException:
            raise Exception()

    def getIssues(self, ids):
        issues = {}
        for id in ids:
            issue = self.getIssue(id)
            issues[issue['id']] = Json.dumps(issue)
        return issues

    def updateIssuesStatus(self, issuesIds, newSatus, note, text):
        issues = {}
        for id in issuesIds:
            issue = self.updateIssueStatus(id, newSatus, note, text)
            issues[issue['id']] = Json.dumps(issue)
        return issues

    # noteText: string
    # issueId: string (or empty)
    # issueIds: list of string (or empty)
    def createNote(self, noteText, issueId, issueIds):

        if issueIds == None:
            issueIds = []
        
        if issueId == '':
            issueId = '0'
        else:
            if issueIds.count(issueId) == 0:
                issueIds.extend(issueId)

        for id in issueIds:
            url = '/api/rest/issues/' + id + '/notes'
            request = self._createRequest()
            newContent = {
                'text': noteText
            }
            newContent = self._serialize(newContent)
            try:
                response = request.post(url, newContent, contentType=self.content_type, headers=self.headers)
                if response.status == 200:
                    print(u'Note added to issue {0}'.format(id))
                else:
                    print(u'Error adding note to issue {0}: {1}'.format(id, response))
            except ClientProtocolException:
                raise Exception()


    def _createRequest(self):
        params = self.mantisbt_server.copy()
        if params['apiKey']:
            params.pop('username')
            params.pop('password')
        return HttpRequest(params)

    def _serialize(self, content):
        return Json.dumps(content).encode(self.encoding)

    def _returnIssue(self, response):
        data = Json.loads(response)
        issues = data['issues']
        issue = issues.pop()
        return {
            'id': issue['id'],
            'project': issue['project']['name'],
            'project_id': issue['project']['id'],
            'summary': issue['summary'],
            'severity': issue['severity']['label'],
            'category': issue['category']['name'],
            'status': issue['status']['label'],
            'priority': issue['priority']['label'],
            'resolution': issue['resolution']['label']
        }