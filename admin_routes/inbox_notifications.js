let inbox_notifications = require('../admin_controllers/inbox_notifications');

module.exports = function (app) {
    app.route('/inbox_notifications').get(inbox_notifications.inbox_notifications);
    app.route('/inbox_notifications').post(inbox_notifications.inbox_notifications);
    app.route('/add_inbox_notification_form').post(inbox_notifications.add_notification_form);
    app.route('/add_inbox_notification').post(inbox_notifications.add_inbox_notification);
    app.route('/get_inbox_notifications_list').post(inbox_notifications.get_notifications);
    app.route('/remove_inbox_notification').post(inbox_notifications.delete);
    app.route('/read_inbox_notification').post(inbox_notifications.read);
};