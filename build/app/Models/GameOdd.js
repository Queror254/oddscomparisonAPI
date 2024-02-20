"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const League_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/League"));
class GameOdd extends Orm_1.BaseModel {
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], GameOdd.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], GameOdd.prototype, "matchday", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], GameOdd.prototype, "match", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], GameOdd.prototype, "matchodds", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], GameOdd.prototype, "oddsvender", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], GameOdd.prototype, "league_id", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], GameOdd.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], GameOdd.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => League_1.default, {
        foreignKey: 'league_id',
    }),
    __metadata("design:type", Object)
], GameOdd.prototype, "league", void 0);
exports.default = GameOdd;
//# sourceMappingURL=GameOdd.js.map