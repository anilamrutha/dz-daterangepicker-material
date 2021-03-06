import React from "react";

function Year(props) {
  const cellClassName = (year: Object) => {
    const mainClass = "dz-calendar__table__body__cell";
    const className = [mainClass];

    if (year.isHovered) {
      className.push(`${mainClass}--hover`);
    }

    if (year.isCurrentYear) {
      className.push(`${mainClass}--today`);
    }

    if (year.selected) {
      className.push(`${mainClass}--active`);
    }

    return className.join(" ");
  };

  const tabIndex = (year: Object) => {
    return year.isCurrentYear ? 1 : 0;
  };

  return (
    <tbody className="dz-calendar__table__body">
      {props.rows.map((week, index) => (
        <tr key={index} className="dz-calendar-table-body-week">
          {week.map((year, index) => (
            <td
              className={cellClassName(year)}
              onMouseUp={e => props.onClickYear(e, year.year)}
              key={index}
              tabIndex={tabIndex(year)}
            >
              <div className="dz-calendar__table__body__cell__content year-content">
                {year.year}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default Year;
