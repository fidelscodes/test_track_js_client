import TestTrackConfig from './testTrackConfig';

var AssignmentOverride = function(options) {
  options = options || {};
  this._visitor = options.visitor;
  this._assignment = options.assignment;
  this._username = options.username;
  this._password = options.password;

  if (!this._visitor) {
    throw new Error('must provide visitor');
  } else if (!this._assignment) {
    throw new Error('must provide assignment');
  } else if (!this._username) {
    throw new Error('must provide username');
  } else if (!this._password) {
    throw new Error('must provide password');
  }
};

AssignmentOverride.prototype.persistAssignment = function() {
  return fetch(TestTrackConfig.getUrl() + '/api/v1/assignment_override', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(this._username + ':' + this._password)
    },
    mode: 'cors',
    body: JSON.stringify({
      visitor_id: this._visitor.getId(),
      split_name: this._assignment.getSplitName(),
      variant: this._assignment.getVariant(),
      context: this._assignment.getContext(),
      mixpanel_result: 'success' // we don't want to track overrides
    })
  })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Unexpected status: ' + [response.status, response.body].join(', '));
      }
    })
    .catch(
      function(error) {
        this._visitor.logError('test_track persistAssignment error: ' + error);
      }.bind(this)
    );
};

export default AssignmentOverride;
