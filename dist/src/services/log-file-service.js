"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class LogFileReader {
    constructor(filePath) {
        this._filePath = filePath;
        this._fileStream = fs.createReadStream(this._filePath, { flags: 'r' });
    }
    getInstance() {
        if (!this._fileStream) {
            console.error('File stream never initialized');
        }
        return this._fileStream;
    }
    static createFileReader(filePath) {
        return new LogFileReader(filePath);
    }
}
exports.LogFileReader = LogFileReader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLWZpbGUtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9sb2ctZmlsZS1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXlCO0FBRXpCLE1BQWEsYUFBYTtJQUl0QixZQUFtQixRQUFnQjtRQUMvQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVNLFdBQVc7UUFDZCxJQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBQztZQUNqQixPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7U0FDbEQ7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFnQjtRQUMzQyxPQUFPLElBQUksYUFBYSxDQUNwQixRQUFRLENBQ1gsQ0FBQztJQUNKLENBQUM7Q0FDTjtBQXJCRCxzQ0FxQkMifQ==