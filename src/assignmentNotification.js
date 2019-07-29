import TestTrackConfig from './testTrackConfig';

var AssignmentNotification = function(options) {
  options = options || {};
  this._visitor = options.visitor;
  this._assignment = options.assignment;

  if (!this._visitor) {
    throw new Error('must provide visitor');
  } else if (!this._assignment) {
    throw new Error('must provide assignment');
  }
};

AssignmentNotification.prototype.send = function() {
  // FIXME: The current implementation of this requires 2 HTTP requests
  // to guarantee that the server is notified of the assignment. By decoupling
  // the assignment notification from the analytics write success we can
  // bring this down to 1 HTTP request

  var first = this._persistAssignment();

  var second = this._visitor.analytics.trackAssignment(this._visitor.getId(), this._assignment).then(
    function(success) {
      return this._persistAssignment(success ? 'success' : 'failure');
    }.bind(this)
  );

  return Promise.all([first, second]);
};

AssignmentNotification.prototype._persistAssignment = function(trackResult) {
  return fetch(TestTrackConfig.getUrl() + '/api/v1/assignment_event', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify({
      visitor_id: this._visitor.getId(),
      split_name: this._assignment.getSplitName(),
      context: this._assignment.getContext(),
      mixpanel_result: trackResult
    })
  })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Unexpected status: ' + [response.status, response.body]);
      }
    })
    .catch(
      function(error) {
        this._visitor.logError('test_track persistAssignment error: ' + error);
      }.bind(this)
    );
};

export default AssignmentNotification;
