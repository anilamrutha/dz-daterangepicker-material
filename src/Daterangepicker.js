import React from "react";
import moment, { Moment } from "moment";
import { arrayTo2DArray2, getMonthWeeks, weekdaysMin } from "./utils";
import Header from "./header/Header";
import TableHeader from "./header/TableHeader";
import Content from "./Content";
import Day from "./calendar/Day";
import Year from "./calendar/Year";
import Month from "./calendar/Month";
import DzPopover from "./DzPopover";
import DzTextField from "./DzTextField";

import "./style/main.css";

class Daterangepicker extends React.Component<> {
  constructor(props) {
    super(props);
    moment.locale(props.locale || "en");

    const { startDate, endDate, minDate, maxDate } = props;
    const date = moment(endDate || this.currentDate);

    this.currentDate = moment().startOf("day");
    this.state = {
      datePicker: props.datePicker || false,
      currentDate: this.currentDate,
      date: date,
      hoveredDate: null,
      focusedDate: date,
      inputType: null,
      activeView: "day",
      startWeek: props.startWeek || "monday",
      year: {
        min: 1990,
        max: 2023,
        num: 24,
        page: 0,
        focused: date.year()
      },
      month: {
        min: 0,
        max: 11,
        focused: date.month()
      },
      day: {
        start: startDate ? moment(startDate) : null,
        end: endDate ? moment(endDate) : null,
        min: minDate ? moment(minDate) : null,
        max: maxDate ? moment(maxDate) : null
      },
      textField: {
        format: "YYYY.MM.DD",
        anchorEl: null
      }
    };

    this.goToPreviousMonths = this.goToPreviousMonths.bind(this);
    this.goToNextMonths = this.goToNextMonths.bind(this);
    this.goToPreviousYear = this.goToPreviousYear.bind(this);
    this.goToNextYear = this.goToNextYear.bind(this);
    this.setRangeDate = this.setRangeDate.bind(this);
    this.onDateMouseOver = this.onDateMouseOver.bind(this);
    this.changeView = this.changeView.bind(this);
    this.setYear = this.setYear.bind(this);
    this.setMonth = this.setMonth.bind(this);
    this.togglePopover = this.togglePopover.bind(this);
  }

  changeView(newView) {
    this.setState({
      activeView: newView
    });
  }

  setRangeDate(event, date) {
    const { day, datePicker } = this.state;
    const startState = {
      day: {
        ...day,
        start: date
      },
      focusedDate: date,
      inputType: "mouse"
    };

    if (datePicker) {
      this.setState({
        day: {
          start: date,
          end: date
        },
        focusedDate: date,
        inputType: "mouse"
      });
    } else if (day.start === null && day.end === null) {
      this.setState(startState);
    } else if (day.start && day.end === null && date.isBefore(day.start)) {
      this.setState(startState);
    } else if (day.start && day.end === null) {
      this.setState({
        day: {
          ...day,
          end: date
        },
        inputType: "mouse"
      });
    } else if (day.start && day.end) {
      this.setState({
        ...startState,
        day: {
          ...startState.day,
          end: null
        }
      });
    }
  }

  onDateFocus(event, date) {
    const newDate = moment(this.state.focusedDate);

    switch (event.key) {
      case "ArrowUp":
        newDate.subtract(7, "d");
        break;
      case "ArrowDown":
        newDate.add(7, "d");
        break;
      case "ArrowLeft":
        newDate.subtract(1, "d");
        break;
      case "ArrowRight":
        newDate.add(1, "d");
        break;
      default:
        return false;
    }

    this.setState(
      {
        focusedDate: newDate,
        inputType: "keyboard"
      },
      () => {
        if (newDate.month() > this.state.date.month()) {
          this.goToNextMonths();
        } else if (newDate.month() < this.state.date.month()) {
          this.goToPreviousMonths();
        }
      }
    );
  }

  onDateMouseOver(event, date) {
    const isSame = date.isSame(this.state.hoveredDate, "day");
    if (isSame) return;

    this.setState({
      hoveredDate: date,
      inputType: "mouse"
    });
  }

  handleKeyDown = (event, date) => {
    if (event.key === "Enter") {
      this.setRangeDate(event, this.state.focusedDate);
    } else {
      this.onDateFocus(event, date);
    }
  };

  getMonthWeeks(year: Number, month: Number) {
    const {
      day,
      currentDate,
      hoveredDate,
      focusedDate,
      inputType
    } = this.state;

    let weeks = getMonthWeeks(year, month, this.state.startWeek);

    weeks = weeks.map((date, index, arr) => ({
      date: date,
      isCurrentDate: DateCompare.isSame(date, currentDate),
      isInRange: DateCompare.isInRange(
        date,
        day.start,
        day.end,
        hoveredDate,
        focusedDate,
        inputType
      ),
      isDisabled: !DateCompare.minMaxDate(date, day.min, day.max),
      isInMonth: DateCompare.isInMonth(date, month),
      isStart: DateCompare.isSame(date, day.start),
      isEnd: DateCompare.isSame(date, day.end),
      maybeEnd: DateCompare.maybeEnd(
        date,
        day.start,
        day.end,
        hoveredDate,
        focusedDate,
        inputType
      ),
      isHovered: DateCompare.isSame(date, hoveredDate),
      isFocused: DateCompare.isSame(date, focusedDate)
    }));

    return arrayTo2DArray2(weeks, 7);
  }

  getYears() {
    const { currentDate, date } = this.state;
    const { num, focused, page } = this.state.year;
    const currentYear = currentDate.year();
    const targetYear = date.year();

    let start = currentYear - 4;

    if (page > 0) {
      start = start + page * num;
    } else {
      start = start - -1 * page * num;
    }

    const end = start + num;

    let years = [];
    for (start; start < end; start++) {
      years.push(start);
    }

    years = years.map((year, index, arr) => ({
      year: year,
      selected: year === targetYear,
      isCurrentYear: year === currentYear,
      isYearBlocked: false,
      isFocused: year === focused
    }));
    return arrayTo2DArray2(years, 4);
  }

  getMonths() {
    const { currentDate, date } = this.state;
    const currentMonth = currentDate.month();
    const targetMonth = date.month();
    const { focused } = this.state.month;

    const months = moment.monthsShort().map((month, monthNum, arr) => ({
      monthNum: monthNum,
      monthName: month,
      selected: monthNum === targetMonth,
      isCurrentMonth: monthNum === currentMonth,
      isMonthBlocked: false,
      isFocused: monthNum === focused
    }));

    return arrayTo2DArray2(months, 4);
  }

  setYear(e, year) {
    const newDate = this.state.date.year(year);
    this.setState(
      {
        date: newDate
      },
      () => this.changeView("month")
    );
  }

  setMonth(e, month) {
    const newDate = this.state.date.month(month);

    this.setState(
      {
        date: newDate
      },
      () => this.changeView("day")
    );
  }

  changeYearPage(e, nextPage: true) {
    const { year } = this.state;

    this.setState({
      year: {
        ...year,
        page: nextPage ? year.page + 1 : year.page - 1
      }
    });
  }

  goToPreviousMonths() {
    this.setState({
      date: this.state.date.subtract(1, "M")
    });
  }

  goToNextMonths() {
    this.setState({
      date: this.state.date.add(1, "M")
    });
  }

  goToPreviousYear() {
    this.setState({
      date: this.state.date.subtract(1, "Y")
    });
  }

  goToNextYear() {
    this.setState({
      date: this.state.date.add(1, "Y")
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { day } = this.state;

    if (
      day.start &&
      day.end &&
      (day.start !== prevState.day.start || day.end !== prevState.day.end)
    ) {
      this.togglePopover(null);
      this.props.onChange(day.start, day.end);
    }
  }

  dayView() {
    const { date, day } = this.state;
    const weeks = this.getMonthWeeks(date.year(), date.month());
    const weekDays = weekdaysMin(this.state.startWeek);

    const changeView = () => this.changeView("year");

    return (
      <React.Fragment>
        <Header
          goToPrevious={this.goToPreviousMonths}
          goToNext={this.goToNextMonths}
          changeView={changeView}
          btnText={`${date.format("MMM")} ${date.year()}`}
          open={false}
        />
        <Content>
          <TableHeader weekDays={weekDays} />
          <Day
            onDateMouseOver={this.onDateMouseOver}
            onClickDay={this.setRangeDate}
            handleKeyDown={this.handleKeyDown}
            weeks={weeks}
            start={day.start}
            end={day.end}
          />
        </Content>
      </React.Fragment>
    );
  }

  yearView() {
    const { date } = this.state;
    const btnText = `${date.format("YYYY")}`;
    const rows = this.getYears();

    const changeView = () => this.changeView("day");

    const nextPage = e => this.changeYearPage(e, true);
    const previousPage = e => this.changeYearPage(e, false);

    return (
      <React.Fragment>
        <Header
          goToPrevious={previousPage}
          goToNext={nextPage}
          changeView={changeView}
          btnText={btnText}
          open
        />
        <Content>
          <TableHeader />
          <Year onClickYear={this.setYear} rows={rows} />
        </Content>
      </React.Fragment>
    );
  }

  monthView() {
    const { date } = this.state;
    const months = this.getMonths();

    return (
      <React.Fragment>
        <Header
          goToPrevious={this.goToPreviousYear}
          goToNext={this.goToNextYear}
          changeView={this.changeView}
          btnText={`${date.format("YYYY")}`}
          open
        />
        <Content>
          <TableHeader />
          <Month onClickMonth={this.setMonth} rows={months} />
        </Content>
      </React.Fragment>
    );
  }

  togglePopover(event) {
    this.setState({
      ...this.state,
      textField: {
        ...this.state.textField,
        anchorEl: event ? event.currentTarget : null
      }
    });
  }

  render() {
    const { day, activeView, textField } = this.state;
    let view = this.dayView();

    if (activeView === "year") {
      view = this.yearView();
    } else if (activeView === "month") {
      view = this.monthView();
    }

    if (this.props.onlyView) {
      return <ViewWrapper {...this.props}>{view}</ViewWrapper>;
    }

    return (
      <DzTextField
        outerProps={this.props.textFieldProps}
        start={day.start}
        end={day.end}
        format={textField.format}
        handleClick={this.togglePopover}
      >
        <DzPopover
          outProps={this.props.popoverProps}
          anchorEl={textField.anchorEl}
          handleClose={() => this.togglePopover(null)}
        >
          <ViewWrapper {...this.props}>{view}</ViewWrapper>
        </DzPopover>
      </DzTextField>
    );
  }
}

const ViewWrapper = props => (
  <div
    className="dz-calendar"
    style={{
      width: props.width,
      height: props.height
    }}
  >
    {props.children}
  </div>
);

class DateCompare {
  static isSame(date1: Moment, date2: Moment) {
    return date1.isSame(date2, "day");
  }

  static isInMonth(targetDate: Moment, month: Number) {
    return targetDate.month() === month;
  }

  static minMaxDate(targetDate: Moment, start: Moment, end: Moment) {
    if (start && end) {
      return targetDate.isBetween(start, end);
    } else if (start) {
      return targetDate.isAfter(start);
    } else if (end) {
      return targetDate.isBefore(end);
    }
    return true;
  }

  static maybeEnd(
    targetDate: Moment,
    start: Moment,
    end: Moment,
    hoveredDate: Moment,
    focusedDate: Moment,
    inputType
  ) {
    if (!start || (start && end)) return false;

    if (inputType === "mouse") {
      return (
        this.isSame(targetDate, hoveredDate) &&
        !start.isAfter(hoveredDate, "day")
      );
    } else if (inputType === "keyboard") {
      return (
        this.isSame(targetDate, focusedDate) &&
        !start.isAfter(focusedDate, "day")
      );
    }
  }

  static isBetweenMaybeEnd(
    targetDate: Moment,
    start: Moment,
    end: Moment,
    maybeEnd: Moment
  ) {
    const isSameOrBeforeEnd = targetDate.isSameOrBefore(maybeEnd, "day");
    const isSameOrAfterStart = targetDate.isSameOrAfter(start, "day");

    return start && !end && isSameOrAfterStart && isSameOrBeforeEnd;
  }

  static isInRange(
    targetDate: Moment,
    start: Moment,
    end: Moment,
    hoveredDate: Moment,
    focusedDate: Moment,
    inputType
  ) {
    const isBetweenStartEnd = targetDate.isBetween(start, end, "day");
    if (isBetweenStartEnd) {
      return true;
    }

    if (inputType === "mouse") {
      return this.isBetweenMaybeEnd(targetDate, start, end, hoveredDate);
    } else if (inputType === "keyboard") {
      return this.isBetweenMaybeEnd(targetDate, start, end, focusedDate);
    }

    return false;
  }
}

export default Daterangepicker;
