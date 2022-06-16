const { Datastore } = require('@google-cloud/datastore');
const path = require('path');

class DatastoreClient {
    constructor() {
        this.datastore = new Datastore({
            projectId: process.env.PROJECT_ID,
            keyFilename: path.join(__dirname, './keyfile.json')
        });
    }
    async save(kind, name, data) {
        const taskKey = this.datastore.key([kind, name]);
        const task = {
            key: taskKey,
            data: data
        };
        await this.datastore.save(task);
    }
    async get(kind, name) {
        const taskKey = this.datastore.key([kind, name]);
        const [task] = await this.datastore.get(taskKey);
        return task;
    }
    async getSubTask(parentkind, parentname, kind, name) {
        const taskKey = this.datastore.key([
            parentkind,
            parentname,
            kind,
            name,
        ]);
        const task = await this.datastore.get(taskKey);
        return task;
    }
    async delete(kind, name) {
        const taskKey = this.datastore.key([kind, name]);
        await this.datastore.delete(taskKey);
    }
    async Exists(kind, name) {
        const data = this.get(kind, name);
        if (data) return true;
        else return false;
    }
    async ArrLookUp(kind, arrName, val) {
        const query = await this.datastore.createQuery(kind).filter(arrName, '=', val);
        const [result] = await this.datastore.runQuery(query);
        return result;
    }
    async FilterEquals(kind, v1, v2) {
        const query = await this.datastore.createQuery(kind).filter(v1, v2);
        const [result] = await this.datastore.runQuery(query);
        return result;
    }
}
module.exports = new DatastoreClient();

