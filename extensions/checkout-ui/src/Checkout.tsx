import {
  reactExtension,
  Button,
  Modal,
  useApi,
  TextBlock,
  Link,
  Banner,
  useOrder,
} from '@shopify/ui-extensions-react/customer-account';
import { BlockStack, Grid } from '@shopify/ui-extensions/checkout';
import React, { useEffect, useState } from 'react';


export default reactExtension(
  'customer-account.order-status.block.render',
  () => <Extension />,
);

function Extension() {
  const order = useOrder();
  const { ui } = useApi();
  const [customerName, setCustomerName] = useState("");
  let [codes, setCodes] = useState([]);
  let [fulfillments, setFulfillments] = useState([]);
  let [lineItems, setlineItems] = useState([]);
  const orderId = order.id.toString();
  const [allDelivered, setAllDelivered] = useState(true);
  const [timeLimit, setTimeLimit] = useState(false);
  const [useCode, setUseCode] = useState(false);
  // const [utcDate, setUtcDate] = useState("");
  const getCustomerNameQuery = {
    query: `query {
      order(id: "${orderId}"){
                    id
            name
            discountApplications(first:50){
              edges{
                node{
                  ... on DiscountCodeApplication{
                    code
                  }
                }
              }
            }lineItems(first:250){
              edges{
                node{
                  id
                  quantity
                }
              }
            }
            fulfillments(first:30){
                edges{
                    node{
                        id
                        events(first:30){
                          nodes{
                            id
                            status
                            happenedAt
                          }
                        }
                        fulfillmentLineItems(first:50){
                          edges{
                            node{
                              id
                              quantity
                              lineItem{
                                id
                                name
                              }
                            }
                          }
                        }

                    }
                }
            }
      }
    }`
  };

  useEffect(() => {
    fetch("shopify://customer-account/api/unstable/graphql.json",
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getCustomerNameQuery),
      })
      .then((response) =>
        response.json())
      .then((data) => {
        //将所有的code记录在codes中
        console.log(data);
        data.data.order.discountApplications.edges.forEach((element) => {
          setCodes(codes => [...codes, element.node.code]);
          if (element.node.code && element.node.code.startsWith("AS-")) {
            console.log("setsuecode true");
            setUseCode(true);
          }
        });
        //将所有的lineItems记录在lineItems中
        data.data.order.lineItems.edges.forEach((element) => {
          setlineItems(lineItems => [...lineItems, element.node]);
        });
        //将所有的fulfillments记录在fulfillments中
        var flag;
        let maxTime = 0;
        data.data.order.fulfillments.edges.forEach((element) => {
          setFulfillments(fulfillments => [...fulfillments, element.node]);
          flag = false;
          let events = element.node.events.nodes;
          for (let j = 0; j < events.length; j++) {
            if (events[j].status === "DELIVERED") {
              flag = true;
              let time = new Date(events[j].happenedAt).getTime();
              if (time > maxTime) {
                maxTime = time;
              }
              break;
            }
          }
        });
        if (!flag) {
          console.log("on the road");
          setAllDelivered(false);
        } else {
          //统计所有lineItem的qunlity，统计所有fulfillmentLineItem的qunlity，如果两者相等，就设置allDelivered为true
          let lineItemQuantity = 0;
          let fulfillmentLineItemQuantity = 0;
          data.data.order.lineItems.edges.forEach((element) => {
            lineItemQuantity += element.node.quantity;
          });
          data.data.order.fulfillments.edges.forEach((element) => {
            element.node.fulfillmentLineItems.edges.forEach((ele) => {
              fulfillmentLineItemQuantity += ele.node.quantity;
            });
          });
          if (lineItemQuantity !== fulfillmentLineItemQuantity) {
            console.log("not allallDelivered", lineItemQuantity, fulfillmentLineItemQuantity);
            setAllDelivered(false);
          } else {
            console.log("allDelivered", lineItemQuantity, fulfillmentLineItemQuantity);
            // //将maxtime转换为ISO8601时间格式
            let date = new Date(maxTime).toISOString();
            console.log(date);
            // 获取当前时间的时间戳
            let now = new Date().getTime();
            // 如果时间距离当前时间大于 30 天，则显示弹窗
            if (now - maxTime < 30 * 24 * 60 * 60 * 1000) {
              console.log("time is ok");
              setTimeLimit(true);
            }
          }
        }
      }).catch(console.error);
  }, []);

  // useEffect(() => {
  //   fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
  //     .then(response => response.json())
  //     .then(data => {
  //       setUtcDate(data.utc_datetime);
  //     })
  //     .catch(error => console.error('Error fetching time:', error));
  // }, []);


  const getDataQuery = `
  query($id: ID!) {
      order (id: $id){
        id
        fulfillments(first:10){
          edges{
            node{
              id
              createdAt
              estimatedDeliveryAt
              latestShipmentStatus
            }
          }
        }
        lineItems(first: 10){
          edges{
            node{
              name
            }
          }
        }
     }
  }`;

  // if (lineItems.length > 40) {
  //   return (
  //     <BlockStack backgroud='subdued'>
  //       <Button
  //         overlay={
  //           <Modal
  //             id="my-modal-2"
  //             padding
  //           >
  //             <TextBlock>
  //               Oops! it's quite a large order. Please take a screenshot and highlight the items you wish to return. <Link to='mailto:service@thecommense.com'>Contact us</Link> with your return reasons, and our customer service team will assist you in verifying and checking to prevent any unnecessary errors.
  //             </TextBlock>
  //           </Modal>
  //         }
  //       >
  //         Request return
  //       </Button>
  //     </BlockStack>
  //   );
  // }

  // else if (fulfillments.length === 0) {
  //   console.log("return null111");
  //   return (null);
  // }

  // //有商品未发货
  // if(!allDelivered) {
  //   console.log("Not allDelivered666!!");
  //   return (
  //     <BlockStack backgroud='subdued'>
  //       <Button
  //         overlay={
  //           <Modal
  //             id="my-modal-2"
  //             padding
  //           >
  //             <TextBlock>
  //               Products was not completely delivered. recommend to wait until fully delivered and reqeust return. If you have any questions, please <Link to='mailto:service@thecommense.com'>contact us</Link>.
  //             </TextBlock>
  //           </Modal>
  //         }
  //       >
  //         Request return
  //       </Button>
  //     </BlockStack>
  //   );
  // }

  // //如果fulfillments中有一个fulfillment的status中没有DELIVERED状态，就不显示
  // else if (fulfillments.length > 0) {
  //   for (let i = 0; i < fulfillments.length; i++) {
  //     let events = fulfillments[i].events.nodes;
  //     let flag = false;
  //     for (let j = 0; j < events.length; j++) {
  //       if (events[j].status === "DELIVERED") {
  //         flag = true;
  //         break;
  //       }
  //     }
  //     if (!flag) {
  //       console.log("not all DELIVERED");
  //       return (
  //         <BlockStack backgroud='subdued'>
  //           <Button
  //             overlay={
  //               <Modal
  //                 id="my-modal-2"
  //                 padding
  //               >
  //                 <TextBlock>
  //                   Products was not completely delivered. recommend to wait until fully delivered and reqeust return. If you have any questions, please <Link to='mailto:service@thecommense.com'>contact us</Link>.
  //                 </TextBlock>
  //               </Modal>
  //             }
  //           >
  //             Request return
  //           </Button>
  //         </BlockStack>
  //       );
  //     }
  //   }
  // }

  // else if (maxTime === 0) {
  //   //记录所有Dilivered时间中的最大值
  //   for (let i = 0; i < fulfillments.length; i++) {
  //     let events = fulfillments[i].events.nodes;
  //     for (let j = 0; j < events.length; j++) {
  //       if (events[j].status === "DELIVERED") {
  //         let time = new Date(events[j].happenedAt).getTime();
  //         if (time > maxTime) {
  //           maxTime = time;
  //         }
  //       }
  //     }
  //   }
  //   if (maxTime !== 0) {
  //     // //将maxtime转换为ISO8601时间格式
  //     let date = new Date(maxTime).toISOString();
  //     console.log(date);
  //     // 获取当前时间的时间戳
  //     let now = new Date().getTime();
  //     // 如果时间距离当前时间大于 30 天，则显示弹窗
  //     if (now - maxTime > 30 * 24 * 60 * 60 * 1000) {
  //       console.log("return null222");
  //       return (null);
  //     }
  //   }
  // }
  // //如果codes中有code是以AS-开头的，就显示弹窗
  // else if (codes.length > 0) {
  //   for (let i = 0; i < codes.length; i++) {
  //     if (codes[i].startsWith("AS-")) {
  //       return (
  //         <Button
  //           overlay={
  //             <Modal
  //               id="my-modal"
  //               padding
  //             >
  //               <TextBlock>
  //                 This order use sc code and cann't apply for a self-service return. If you have any questions, please <Link to='mailto:service@thecommense.com'>contact us</Link>.
  //               </TextBlock>
  //             </Modal>
  //           }
  //         >
  //           Request return
  //         </Button>
  //       );
  //     }
  //   }
  // }

  if (lineItems.length > 40) {
    return (
      <BlockStack backgroud='subdued'>
        <Button
          overlay={
            <Modal
              id="my-modal-2"
              padding
            >
              <TextBlock>
                Oops! it's quite a large order. Please take a screenshot and highlight the items you wish to return. <Link to='mailto:service@thecommense.com'>Contact us</Link> with your return reasons, and our customer service team will assist you in verifying and checking to prevent any unnecessary errors.
              </TextBlock>
            </Modal>
          }
        >
          Request return
        </Button>
      </BlockStack>
    );
  }

  //使用code
  else if (useCode) {
    console.log("useCode");
    return (
      <BlockStack backgroud='subdued'>
        <Button
          overlay={
            <Modal
              id="my-modal"
              padding
            >
              <TextBlock>
                This order use sc code and cann't apply for a self-service return. If you have any questions, please <Link to='mailto:service@thecommense.com'>contact us</Link>.
              </TextBlock>
            </Modal>
          }
        >
          Request return
        </Button>
      </BlockStack>
    );
  }

  else if(fulfillments.length==0){
    console.log("no fulfillment");
    return(null);
  }

  //有商品未发货
  else if (!allDelivered) {
    console.log("Not allDelivered666!!");
    return (
      <BlockStack backgroud='subdued'>
        <Button
          overlay={
            <Modal
              id="my-modal-2"
              padding
            >
              <TextBlock>
                Products was not completely delivered. recommend to wait until fully delivered and reqeust return. If you have any questions, please <Link to='mailto:service@thecommense.com'>contact us</Link>.
              </TextBlock>
            </Modal>
          }
        >
          Request return
        </Button>
      </BlockStack>
    );
  }
  //超过30天
  else if (!timeLimit) {
    console.log("return null333");
    return (null);
  }

  else if (order) {
    console.log("enterOrder");
    const toURL = `https://aureturn.thecommense.com/return/${(order.id).substring(20)}`;
    return (
      <BlockStack background='subdued'>
        <Button to={toURL}>
          Request return
        </Button>
      </BlockStack>
    );
  }
  else {
    return (
      <Banner>
        internal error
      </Banner>);
  }
}